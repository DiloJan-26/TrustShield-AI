import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { sharedStyles } from "./sharedStyles";

const protectionItems = ["SMS", "WhatsApp", "Gmail", "Browser"];

export function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>TrustShield AI is ON</Text>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Protection</Text>
          {protectionItems.map((item) => (
            <Text key={item} style={styles.item}>
              ✓ {item}
            </Text>
          ))}
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Privacy</Text>
          <Text style={styles.item}>No cloud AI</Text>
          <Text style={styles.item}>Local Gemma 4 protection</Text>
        </View>

        <PrimaryButton title="Analyze Message" onPress={() => router.push("/analyze" as never)} />
        <PrimaryButton title="Privacy" variant="secondary" onPress={() => router.push("/privacy" as never)} />
        <PrimaryButton title="Settings" variant="secondary" onPress={() => router.push("/settings" as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  item: {
    color: "#334155",
    fontSize: 19,
    lineHeight: 28,
  },
});
