import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { EvidenceList } from "../components/EvidenceList";
import { analyzeMockMessage } from "../services/mockAnalysisService";
import { sharedStyles } from "./sharedStyles";

export function FamilyAlertScreen() {
  const params = useLocalSearchParams<{ text?: string }>();
  const messageText = typeof params.text === "string" ? params.text : "";
  const result = analyzeMockMessage(messageText);
  const riskLabel = result.risk_level === "dangerous" ? "Dangerous" : "Suspicious";

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Family Alert</Text>
        <View style={sharedStyles.card}>
          <Text style={styles.alertTitle}>TrustShield AI warning:</Text>
          <Text style={sharedStyles.body}>A suspicious message was detected.</Text>
          <Text style={sharedStyles.label}>Message:</Text>
          <Text style={styles.quote}>{`"${messageText}"`}</Text>
          <Text style={sharedStyles.label}>Risk:</Text>
          <Text style={styles.risk}>{riskLabel}</Text>
          <Text style={sharedStyles.label}>Reason:</Text>
          <EvidenceList items={result.evidence} />
          <Text style={sharedStyles.body}>
            Please check before opening links, sharing OTP, or sending money.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  alertTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  quote: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    color: "#334155",
    fontSize: 17,
    lineHeight: 25,
    padding: 14,
  },
  risk: {
    color: "#b91c1c",
    fontSize: 20,
    fontWeight: "900",
  },
});
