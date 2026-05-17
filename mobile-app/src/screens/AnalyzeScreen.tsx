import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { scanCodeWithCamera } from "../native/TrustShieldBarcode";
import {
  buildBarcodeOnlyContext,
  extractImageContext,
  type ImageContextResult,
} from "../services/imageContextExtractor";
import {
  getTrustShieldModelMode,
  getTrustShieldModelModeLabel,
  getGemmaRuntimeState,
} from "../services/model/modelConfig";
import { analyzeWithTrustShieldModel } from "../services/model/trustShieldModelClient";
import type { ModelMode } from "../services/model/modelTypes";
import {
  retrieveScamPlaybookMatches,
  toCompactPlaybookForPrompt,
} from "../services/scamPlaybook";
import { extractScamSignals } from "../services/scamSignalExtractor";
import { sharedStyles } from "./sharedStyles";

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

export function AnalyzeScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [imageContext, setImageContext] = useState<ImageContextResult | null>(null);
  const [ocrError, setOcrError] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [modelMode, setModelMode] = useState<ModelMode>(getTrustShieldModelMode());
  const [isGemmaReady, setIsGemmaReady] = useState(getGemmaRuntimeState().ready);
  const signalResult = useMemo(() => extractScamSignals(text), [text]);
  const modelLabel = getTrustShieldModelModeLabel(modelMode);

  useFocusEffect(
    useCallback(() => {
      setModelMode(getTrustShieldModelMode());
      setIsGemmaReady(getGemmaRuntimeState().ready);
    }, []),
  );

  async function analyze() {
    const message = text.trim();
    if (!message) return;

    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const detectedUrls = unique([...signalResult.urls, ...(imageContext?.urls ?? [])]);
      const playbookMatches = retrieveScamPlaybookMatches({
        text: message,
        signals: signalResult.signals,
        urls: detectedUrls,
        scam_type_hint: signalResult.scam_type_hint,
      });
      const modelResult = await analyzeWithTrustShieldModel({
        ocr_text: message,
        detected_urls: detectedUrls,
        detected_signals: signalResult.signals,
        base_risk: signalResult.base_risk,
        rule_risk_hint: signalResult.base_risk,
        evidence: signalResult.evidence,
        scam_type_hint: signalResult.scam_type_hint,
        retrieved_playbook: toCompactPlaybookForPrompt(playbookMatches),
        debug_info: {
          rule_signals: signalResult.signals,
          scam_type_hint: signalResult.scam_type_hint,
          playbook_ids: playbookMatches.map((entry) => entry.id),
          extraction_source: imageContext
            ? imageContext.context_summary.has_ocr_text && imageContext.context_summary.has_barcode
              ? "ocr_qr"
              : imageContext.context_summary.has_barcode
                ? "qr"
                : "ocr"
            : "manual",
        },
      });

      router.push({
        pathname: "/result",
        params: {
          text: message,
          signals: JSON.stringify(signalResult.signals),
          result: JSON.stringify({
            ...modelResult,
            tamil_warning: "",
          }),
        },
      } as never);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not complete local model analysis. Using local safety fallback.";
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelectedImage(imageUri: string) {
    setIsOcrLoading(true);
    setOcrError("");
    try {
      const result = await extractImageContext(imageUri);
      setImageContext(result);
      setText(result.combined_text);
    } catch {
      setOcrError("Could not read enough text or QR content. Try a clearer image.");
    } finally {
      setIsOcrLoading(false);
    }
  }

  async function detectQrForAnalysis() {
    setOcrError("");
    try {
      const result = await scanCodeWithCamera();
      if (result.raw_values.length === 0) {
        setOcrError("No QR or barcode content was detected. You can still use Pick Screenshot.");
        return;
      }

      const context = buildBarcodeOnlyContext(result.barcodes);
      setImageContext(context);
      setText(context.combined_text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/cancel/i.test(message)) return;
      setOcrError("QR detection is not available on this device. You can still use Pick Screenshot.");
      return;
    }
  }

  async function pickScreenshotForAnalysis() {
    setOcrError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setOcrError("Gallery permission is needed to read a screenshot.");
      return;
    }

    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (selected.canceled || selected.assets.length === 0) return;

    await handleSelectedImage(selected.assets[0].uri);
  }

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Analyze Message</Text>
        <Text style={sharedStyles.body}>
          Pick a screenshot or paste a message. TrustShield analyzes it on this device.
        </Text>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Reasoning engine</Text>
          <Text style={sharedStyles.body}>{modelLabel}</Text>
          {modelMode === "base_gemma" ? (
            <Text style={styles.privacyText}>
              Gemma status: {isGemmaReady ? "Ready" : "Not initialized"}
            </Text>
          ) : null}
          <Text style={styles.privacyText}>Privacy: No cloud AI / On-device processing</Text>
        </View>

        <View style={styles.imageButtonRow}>
          <PrimaryButton
            title="Detect QR"
            onPress={detectQrForAnalysis}
            disabled={isOcrLoading}
            style={styles.imageButton}
          />
          <PrimaryButton
            title={isOcrLoading ? "Extracting..." : "Pick Screenshot"}
            onPress={pickScreenshotForAnalysis}
            disabled={isOcrLoading}
            style={styles.imageButton}
          />
        </View>
        <Text style={styles.helperText}>
          Detect a live QR/barcode, or choose a screenshot of a suspicious message, QR code, or link.
        </Text>
        {ocrError ? <Text style={styles.errorText}>{ocrError}</Text> : null}

        <TextInput
          multiline
          value={text}
          onChangeText={(value) => {
            setText(value);
            setImageContext(null);
          }}
          placeholder="OCR text will appear here, or paste/type a message"
          placeholderTextColor="#64748b"
          style={styles.input}
          textAlignVertical="top"
        />

        {imageContext ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>Image context extracted</Text>
            <Text style={styles.contextText}>
              Visible text found: {imageContext.context_summary.has_ocr_text ? "Yes" : "No"}
            </Text>
            <Text style={styles.contextText}>
              QR/barcode found: {imageContext.context_summary.has_barcode ? "Yes" : "No"}
            </Text>
            <Text style={styles.contextText}>
              URLs found: {imageContext.context_summary.url_count}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          title={
            isAnalyzing
              ? modelMode === "base_gemma"
                ? "Analyzing locally with Base Gemma 4 E2B..."
                : "Analyzing with local safety mode..."
              : "Analyze with TrustShield AI"
          }
          onPress={analyze}
          disabled={!text.trim() || isOcrLoading || isAnalyzing}
        />
        {analysisError ? <Text style={styles.errorText}>{analysisError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  helperText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  input: {
    minHeight: 150,
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 18,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 18,
    lineHeight: 26,
    padding: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  privacyText: {
    color: "#0f766e",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
  contextText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
});
