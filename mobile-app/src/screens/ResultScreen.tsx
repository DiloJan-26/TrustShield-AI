import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EvidenceList } from "../components/EvidenceList";
import { PrimaryButton } from "../components/PrimaryButton";
import { RiskBadge } from "../components/RiskBadge";
import { TRUSTSHIELD_MODEL_CONFIG } from "../services/model/modelConfig";
import { analyzeMockMessage } from "../services/mockAnalysisService";
import { extractScamSignals } from "../services/scamSignalExtractor";
import type { TrustShieldResult } from "../types/analysis";
import { sharedStyles } from "./sharedStyles";

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

export function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; result?: string }>();
  const messageText = typeof params.text === "string" ? params.text : "";
  const signalResult = extractScamSignals(messageText);
  const fallbackResult = analyzeMockMessage(messageText, signalResult);
  const result = parseResultParam(typeof params.result === "string" ? params.result : undefined) ?? {
    ...fallbackResult,
    tamil_warning: "",
  };
  const isRisky = result.risk_level !== "safe";
  const shouldShowTamilWarning = result.tamil_warning.trim().length > 0;

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Result</Text>
        <View style={[sharedStyles.card, styles[result.risk_level]]}>
          <RiskBadge riskLevel={result.risk_level} />
          <Text style={styles.confidence}>Confidence: {Math.round(result.confidence * 100)}%</Text>
          <Text style={styles.type}>{result.scam_type}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Warning</Text>
          <Text style={sharedStyles.body}>{result.simple_warning}</Text>
          {shouldShowTamilWarning ? (
            <Text style={sharedStyles.body}>{result.tamil_warning}</Text>
          ) : null}
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Safe action</Text>
          <Text style={sharedStyles.body}>{result.safe_action}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Evidence</Text>
          <EvidenceList items={result.evidence} />
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Family alert</Text>
          <Text style={sharedStyles.body}>{result.family_alert}</Text>
        </View>

        <Text style={styles.privacy}>Privacy mode: On-device / No cloud AI</Text>
        <Text style={styles.model}>Model: {TRUSTSHIELD_MODEL_CONFIG.mode === "mock" ? "Mock Safety Mode" : TRUSTSHIELD_MODEL_CONFIG.mode}</Text>

        {isRisky ? (
          <PrimaryButton
            title="Ask Family"
            variant="danger"
            onPress={() => router.push({ pathname: "/family-alert", params: { text: messageText } } as never)}
          />
        ) : null}
        <PrimaryButton title="Analyze Another Message" variant="secondary" onPress={() => router.push("/analyze" as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
  },
  privacy: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
  model: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
});
