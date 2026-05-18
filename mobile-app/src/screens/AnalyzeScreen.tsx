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
  checkSafeLinkPreview,
  type SafeLinkPreviewKind,
  type SafeLinkPreviewResult,
} from "../services/safeLinkPreview";
import {
  retrieveScamPlaybookMatches,
  toCompactPlaybookForPrompt,
} from "../services/scamPlaybook";
import {
  computeBaseRisk,
  extractSafeLinkPreviewSignals,
  extractScamSignals,
} from "../services/scamSignalExtractor";
import {
  analyzeUrlsLocally,
  summarizeUrlContext,
  type UrlContext,
} from "../services/urlIntelligence";
import { sharedStyles } from "./sharedStyles";

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function uniqueUrlContexts(items: UrlContext[]): UrlContext[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source}:${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getUrlRiskScore(context: UrlContext): number {
  let score = 0;
  if (context.brand_impersonation_hint) score += 5;
  if (context.suspicious_tld) score += 4;
  if (context.is_shortened) score += 3;
  if (!context.trusted_domain) score += 2;
  if ((context.path_keywords?.length ?? 0) > 0) score += 1;
  return score;
}

function selectHighestRiskUrlContext(contexts: UrlContext[]): UrlContext | undefined {
  return [...contexts].sort((a, b) => getUrlRiskScore(b) - getUrlRiskScore(a))[0];
}

function getPreviewStatusText(result: SafeLinkPreviewResult | null): string {
  if (!result) return "";
  if (result.status === "no_internet") {
    return result.error_message ?? "Internet is off. Safety Preview needs internet, but you can still analyze locally.";
  }
  if (result.status === "blocked") {
    return `Preview blocked for safety: ${result.blocked_reason ?? "unsafe link"}`;
  }
  if (result.status === "failed") {
    return result.error_message ?? "Could not check this website preview. You can still analyze locally.";
  }
  return "";
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
  const [safePreviewResult, setSafePreviewResult] = useState<SafeLinkPreviewResult | null>(null);
  const [isSafePreviewChecking, setIsSafePreviewChecking] = useState(false);
  const signalResult = useMemo(() => extractScamSignals(text), [text]);
  const manualUrlContexts = useMemo(
    () => (imageContext ? [] : analyzeUrlsLocally(signalResult.urls, "manual")),
    [imageContext, signalResult.urls],
  );
  const qrUrlContexts = useMemo(
    () => imageContext?.url_contexts.filter((context) => context.source === "qr_barcode") ?? [],
    [imageContext],
  );
  const visibleOrManualUrlContexts = useMemo(
    () =>
      imageContext
        ? imageContext.url_contexts.filter((context) => context.source === "visible_text")
        : manualUrlContexts,
    [imageContext, manualUrlContexts],
  );
  const primaryQrContext = selectHighestRiskUrlContext(qrUrlContexts);
  const primaryUrlContext = selectHighestRiskUrlContext(visibleOrManualUrlContexts);
  const previewContext = primaryQrContext ?? (!imageContext?.context_summary.has_barcode ? primaryUrlContext : undefined);
  const previewKind: SafeLinkPreviewKind | null = primaryQrContext ? "qr" : previewContext ? "url" : null;
  const shouldShowSafePreview = Boolean(previewContext && previewKind);
  const safePreviewStatusText = getPreviewStatusText(safePreviewResult);
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
      const urlContexts = uniqueUrlContexts([
        ...(imageContext?.url_contexts ?? []),
        ...manualUrlContexts,
      ]);
      const safeLinkPreviews = safePreviewResult ? [safePreviewResult] : [];
      const previewSignalResult = extractSafeLinkPreviewSignals(safeLinkPreviews, urlContexts);
      const detectedSignals = unique([...signalResult.signals, ...previewSignalResult.signals]);
      const evidence = unique([...signalResult.evidence, ...previewSignalResult.evidence]);
      const baseRisk = computeBaseRisk(detectedSignals);
      const playbookMatches = retrieveScamPlaybookMatches({
        text: message,
        signals: detectedSignals,
        urls: detectedUrls,
        scam_type_hint: signalResult.scam_type_hint,
      });
      const modelResult = await analyzeWithTrustShieldModel({
        ocr_text: message,
        detected_urls: detectedUrls,
        detected_signals: detectedSignals,
        base_risk: baseRisk,
        rule_risk_hint: baseRisk,
        evidence,
        scam_type_hint: signalResult.scam_type_hint,
        retrieved_playbook: toCompactPlaybookForPrompt(playbookMatches),
        url_contexts: urlContexts,
        qr_safe_preview:
          safeLinkPreviews[0]?.kind === "qr" ? safeLinkPreviews : undefined,
        safe_link_previews: safeLinkPreviews.length > 0 ? safeLinkPreviews : undefined,
        debug_info: {
          rule_signals: detectedSignals,
          scam_type_hint: signalResult.scam_type_hint,
          playbook_ids: playbookMatches.map((entry) => entry.id),
          qr_preview_used: safeLinkPreviews.some((preview) => preview.kind === "qr"),
          url_preview_used: safeLinkPreviews.some((preview) => preview.kind === "url"),
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
          signals: JSON.stringify(detectedSignals),
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
      setSafePreviewResult(null);
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
      setSafePreviewResult(null);
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

  async function checkLinkSafely() {
    if (!previewContext || !previewKind) return;

    setIsSafePreviewChecking(true);
    setSafePreviewResult(null);
    try {
      const result = await checkSafeLinkPreview({
        url: previewContext.url,
        kind: previewKind,
        source: previewContext.source,
      });
      setSafePreviewResult(result);
    } finally {
      setIsSafePreviewChecking(false);
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
            setSafePreviewResult(null);
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

        {shouldShowSafePreview && previewContext && previewKind ? (
          <View style={sharedStyles.card}>
            <Text style={sharedStyles.cardTitle}>
              {previewKind === "qr" ? "QR Safe Preview" : "URL Safety Preview"}
            </Text>
            <Text style={styles.contextText}>
              {previewKind === "qr"
                ? "TrustShield found a QR link. You can check limited website information before analysis. This will not open the website."
                : "TrustShield found a link in this message. You can check limited website information before analysis. This will not open the website."}
            </Text>
            <Text style={styles.contextText}>
              Domain: {previewContext.domain ?? "Unknown"}
            </Text>
            <Text style={styles.contextText}>
              Local check: {summarizeUrlContext(previewContext)}
            </Text>
            {getUrlRiskScore(previewContext) > 0 ? (
              <Text style={styles.previewText}>Previewing highest-risk link.</Text>
            ) : null}
            <PrimaryButton
              title={
                isSafePreviewChecking
                  ? "Checking..."
                  : previewKind === "qr"
                    ? "Check QR Safely"
                    : "Check URL Safely"
              }
              onPress={checkLinkSafely}
              disabled={isSafePreviewChecking}
              variant="secondary"
            />
            {isSafePreviewChecking ? (
              <Text style={styles.previewText}>Checking limited public website info...</Text>
            ) : null}
            {safePreviewStatusText ? (
              <Text style={safePreviewResult?.status === "no_internet" ? styles.previewWarning : styles.errorText}>
                {safePreviewStatusText}
              </Text>
            ) : null}
            {safePreviewResult?.status === "completed" ? (
              <View style={styles.previewSummary}>
                <Text style={styles.previewTitle}>Safety Preview completed</Text>
                <Text style={styles.previewText}>
                  Domain: {safePreviewResult.domain ?? previewContext.domain ?? "Unknown"}
                </Text>
                {safePreviewResult.page_title || safePreviewResult.og_title ? (
                  <Text style={styles.previewText}>
                    Page title: {safePreviewResult.og_title || safePreviewResult.page_title}
                  </Text>
                ) : null}
                <Text style={styles.previewText}>
                  Redirects: {safePreviewResult.redirect_count ?? 0}
                </Text>
                <Text style={styles.previewText}>
                  Status: {safePreviewResult.http_status ?? "Unknown"}
                </Text>
                <Text style={styles.previewReady}>Now tap Analyze with TrustShield AI.</Text>
              </View>
            ) : null}
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
  previewSummary: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  previewTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  previewText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  previewWarning: {
    color: "#a16207",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
  previewReady: {
    color: "#0f766e",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 23,
  },
});
