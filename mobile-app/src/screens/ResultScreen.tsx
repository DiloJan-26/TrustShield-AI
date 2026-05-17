import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EvidenceList } from "../components/EvidenceList";
import { PrimaryButton } from "../components/PrimaryButton";
import { RiskBadge } from "../components/RiskBadge";
import { getFriendlyScamType } from "../services/friendlyLabels";
import { analyzeMockMessage } from "../services/mockAnalysisService";
import { extractScamSignals } from "../services/scamSignalExtractor";
import type { TrustShieldResult } from "../types/analysis";
import { sharedStyles } from "./sharedStyles";

function getModelLabel(source?: TrustShieldResult["model_source"]) {
  if (source === "base_gemma") return "Base Gemma 4 E2B";
  if (source === "local_fallback") return "Local safety fallback";
  return "Mock Safety Mode";
}

function parseResultParam(resultParam?: string): TrustShieldResult | null {
  if (!resultParam) return null;

  try {
    const parsed = JSON.parse(resultParam) as TrustShieldResult;
    if (
      parsed &&
      ["safe", "suspicious", "dangerous"].includes(parsed.risk_level) &&
      typeof parsed.confidence === "number" &&
      typeof parsed.scam_type === "string" &&
      Array.isArray(parsed.evidence) &&
      typeof parsed.simple_warning === "string" &&
      typeof parsed.safe_action === "string" &&
      typeof parsed.family_alert === "string"
    ) {
      return {
        ...parsed,
        tamil_warning: typeof parsed.tamil_warning === "string" ? parsed.tamil_warning : "",
      };
    }
  } catch {
    return null;
  }

  return null;
}

function fallbackExplanation() {
  return "TrustShield checked this message for links, OTP requests, payments, urgency, and impersonation.";
}

function limitWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function buildHandlingText(result: TrustShieldResult): string {
  const safestAction = result.how_to_handle?.safest_action?.trim();
  if (safestAction) return limitWords(safestAction, 40);
  return limitWords(result.safe_action, 40);
}

function buildExplanationText(result: TrustShieldResult, handlingText: string): string {
  const explanation = result.explanation?.trim() || fallbackExplanation();
  if (explanation.toLowerCase() === handlingText.trim().toLowerCase()) {
    return fallbackExplanation();
  }

  return limitWords(explanation, 40);
}

export function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; result?: string; signals?: string }>();
  const messageText = typeof params.text === "string" ? params.text : "";
  const signalResult = extractScamSignals(messageText);
  const fallbackResult = analyzeMockMessage(messageText, signalResult);
  const result = parseResultParam(typeof params.result === "string" ? params.result : undefined) ?? {
    ...fallbackResult,
    tamil_warning: "",
    model_source: "mock" as const,
  };
  const isRisky = result.risk_level !== "safe";
  const modelLabel = getModelLabel(result.model_source);
  const friendlyScamType = getFriendlyScamType(result.scam_type);
  const evidence = result.evidence.length > 0 ? result.evidence.slice(0, 4) : signalResult.evidence.slice(0, 4);
  const handlingText = buildHandlingText(result);
  const explanation = buildExplanationText(result, handlingText);

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Result</Text>

        <View style={[sharedStyles.card, styles.riskCard, styles[result.risk_level]]}>
          <RiskBadge riskLevel={result.risk_level} />
          <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>
          <Text style={styles.type}>{friendlyScamType}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>What this message is saying</Text>
          <Text style={sharedStyles.body}>{explanation}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Evidence found</Text>
          <EvidenceList items={evidence} />
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>How to handle it</Text>
          <Text style={sharedStyles.body}>{handlingText}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Model and privacy</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model</Text>
            <Text style={styles.detailValue}>{modelLabel}</Text>
          </View>
          {result.latency_ms ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Analysis time</Text>
              <Text style={styles.detailValue}>{(result.latency_ms / 1000).toFixed(1)} seconds</Text>
            </View>
          ) : null}
          <Text style={styles.privacy}>Privacy: On-device / No cloud AI</Text>
        </View>

        {isRisky ? (
          <PrimaryButton
            title="Scam State Report"
            variant="danger"
            onPress={() => router.push({ pathname: "/scam-report", params: { text: messageText } } as never)}
          />
        ) : null}
        <PrimaryButton
          title="Analyze Another Message"
          variant="secondary"
          onPress={() => router.push("/analyze" as never)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  riskCard: {
    gap: 10,
  },
  safe: {
    borderColor: "#86efac",
  },
  suspicious: {
    borderColor: "#facc15",
  },
  dangerous: {
    borderColor: "#fca5a5",
  },
  confidence: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
  type: {
    color: "#334155",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 27,
  },
  privacy: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
  detailRow: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 8,
  },
  detailLabel: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
  },
  detailValue: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
});
