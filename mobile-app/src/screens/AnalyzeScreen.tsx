import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { recognizeText } from "../native/TrustShieldOCR";
import {
  getTrustShieldModelMode,
  getTrustShieldModelModeLabel,
  getGemmaRuntimeState,
} from "../services/model/modelConfig";
import { analyzeWithTrustShieldModel } from "../services/model/trustShieldModelClient";
import type { ModelMode } from "../services/model/modelTypes";
import { extractScamSignals } from "../services/scamSignalExtractor";
import { sharedStyles } from "./sharedStyles";

export function AnalyzeScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
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
      const modelResult = await analyzeWithTrustShieldModel({
        ocr_text: message,
        detected_urls: signalResult.urls,
        detected_signals: signalResult.signals,
        base_risk: signalResult.base_risk,
        evidence: signalResult.evidence,
        scam_type_hint: signalResult.scam_type_hint,
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

  async function pickScreenshot() {
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

    setIsOcrLoading(true);
    try {
      const result = await recognizeText(selected.assets[0].uri);
      const detectedText = result.full_text.trim();
      setText(detectedText);
      if (!detectedText) {
        setOcrError("No readable text was found in this image.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR failed for this image.";
      setOcrError(message);
    } finally {
      setIsOcrLoading(false);
    }
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
          <Text style={styles.privacyText}>Privacy: No cloud AI</Text>
        </View>

        <PrimaryButton
          title={isOcrLoading ? "Reading Screenshot..." : "Pick Screenshot"}
          onPress={pickScreenshot}
          disabled={isOcrLoading}
        />
        {ocrError ? <Text style={styles.errorText}>{ocrError}</Text> : null}

        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder="OCR text will appear here, or paste/type a message"
          placeholderTextColor="#64748b"
          style={styles.input}
          textAlignVertical="top"
        />

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
});
