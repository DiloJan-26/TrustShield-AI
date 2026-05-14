import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { sharedStyles } from "./sharedStyles";

export function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <View style={styles.hero}>
          <Text style={sharedStyles.title}>TrustShield AI</Text>
          <Text style={sharedStyles.subtitle}>One Shield Before the Scam</Text>
          <Text style={sharedStyles.body}>
            Private scam protection for parents and grandparents.
          </Text>
        </View>
        <PrimaryButton title="Get Started" onPress={() => router.push("/home" as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 14,
    paddingTop: 48,
    paddingBottom: 18,
  },
});
