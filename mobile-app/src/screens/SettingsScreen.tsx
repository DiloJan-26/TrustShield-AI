import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { sharedStyles } from "./sharedStyles";

const settings = [
  ["Privacy Mode", "ON"],
  ["Family Alert", "Enabled"],
  ["Language", "English/Tamil"],
  ["Device Mode", "Demo Foundation Mode"],
];

export function SettingsScreen() {
  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Settings</Text>
        <View style={sharedStyles.card}>
          {settings.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 12,
  },
  label: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
  },
  value: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },
});
