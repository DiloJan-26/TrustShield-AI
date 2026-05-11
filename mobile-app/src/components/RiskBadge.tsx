import { StyleSheet, Text, View } from "react-native";
import type { RiskLevel } from "../types/analysis";

type RiskBadgeProps = {
  riskLevel: RiskLevel;
};

const riskStyles = {
  safe: {
    label: "SAFE",
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    color: "#166534",
  },
  suspicious: {
    label: "SUSPICIOUS",
    backgroundColor: "#fef3c7",
    borderColor: "#facc15",
    color: "#92400e",
  },
  dangerous: {
    label: "DANGEROUS",
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    color: "#991b1b",
  },
};

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const style = riskStyles[riskLevel];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: style.backgroundColor, borderColor: style.borderColor },
      ]}
    >
      <Text style={[styles.text, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: "900",
  },
});
