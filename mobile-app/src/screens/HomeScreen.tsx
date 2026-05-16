import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  cancelQuickNotification,
  isNotificationPermissionGranted,
  requestNotificationPermission,
  showQuickNotification,
} from "../native/TrustShieldQuickNotification";
import { sharedStyles } from "./sharedStyles";

type QuickNotificationStatus = "Checking" | "Enabled" | "Permission needed" | "Hidden until app reopens";

export function HomeScreen() {
  const router = useRouter();
  const [quickStatus, setQuickStatus] = useState<QuickNotificationStatus>("Checking");

  const refreshQuickNotificationStatus = useCallback(async () => {
    try {
      const granted = await isNotificationPermissionGranted();
      setQuickStatus(granted ? "Enabled" : "Permission needed");
    } catch {
      setQuickStatus("Permission needed");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshQuickNotificationStatus();
    }, [refreshQuickNotificationStatus]),
  );

  async function enableQuickAccess() {
    try {
      const permission = await requestNotificationPermission();
      if (!permission.granted) {
        setQuickStatus("Permission needed");
        return;
      }

      const result = await showQuickNotification();
      setQuickStatus(result.shown ? "Enabled" : "Permission needed");
    } catch {
      setQuickStatus("Permission needed");
    }
  }

  async function hideQuickAccess() {
    try {
      await cancelQuickNotification();
      setQuickStatus("Hidden until app reopens");
    } catch {
      setQuickStatus("Permission needed");
    }
  }

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

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Quick Access Notification</Text>
          <Text style={sharedStyles.body}>
            TrustShield stays ready in your notification bar. Take a screenshot of a suspicious
            message, then tap Open TrustShield to scan it.
          </Text>
          <Text style={styles.status}>Status: {quickStatus}</Text>
          <PrimaryButton title="Enable Quick Access" onPress={enableQuickAccess} />
          <PrimaryButton title="Hide Notification" variant="secondary" onPress={hideQuickAccess} />
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
  status: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
});
