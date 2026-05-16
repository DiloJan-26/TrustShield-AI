import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { sharedStyles } from "./sharedStyles";

export function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <View style={styles.hero}>
          <Text style={sharedStyles.title}>TrustShield AI</Text>
          <Text style={sharedStyles.subtitle}>One Shield Before the Scam</Text>
          <Text style={sharedStyles.body}>
            TrustShield AI is a privacy-first mobile safety layer that protects low-digital-literacy users from scam messages through SMS, WhatsApp, Gmail, browsers, and QR/payment screens.
          </Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Privacy</Text>
          <Text style={styles.item}># No cloud AI - Local Gemma 4 protection</Text>
          <Text style={styles.item}># All Sensitive messages are processed locally</Text>
        </View>

        <PrimaryButton title="Analyze Message" onPress={() => router.push("/analyze" as never)} />
        <PrimaryButton title="Privacy" variant="secondary" onPress={() => router.push("/privacy" as never)} />
        <PrimaryButton title="Settings" variant="secondary" onPress={() => router.push("/settings" as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 14,
    paddingTop: 48,
    paddingBottom: 10,
  },
  item: {
    color: "#334155",
    fontSize: 19,
    lineHeight: 28,
  },
});
