import { StyleSheet, Text, View } from "react-native";

type EvidenceListProps = {
  items: string[];
};

export function EvidenceList({ items }: EvidenceListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  check: {
    color: "#0f766e",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  text: {
    color: "#334155",
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
  },
});
