import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { demoMessages } from "../data/demoMessages";
import { recognizeText } from "../native/TrustShieldOCR";
import { extractScamSignals, type BaseRisk } from "../services/scamSignalExtractor";
import { colors, sharedStyles } from "./sharedStyles";

const riskColors: Record<BaseRisk, { borderColor: string; color: string; backgroundColor: string }> = {
  safe: {
    borderColor: "#86efac",
    color: "#166534",
    backgroundColor: "#dcfce7",
  },
  suspicious: {
    borderColor: "#facc15",
    color: "#92400e",
    backgroundColor: "#fef3c7",
  },
  dangerous: {
    borderColor: "#fca5a5",
    color: "#991b1b",
    backgroundColor: "#fee2e2",
  },
};

export function AnalyzeScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const signalResult = useMemo(() => extractScamSignals(text), [text]);
  const gateStyle = riskColors[signalResult.base_risk];

  function analyze() {
    const message = text.trim();
    if (!message) return;
    router.push({ pathname: "/result", params: { text: message } } as never);
  }

  async function pickScreenshot() {
    setOcrError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setOcrError("Gallery permission is needed to read a screenshot.");
      return;
    }

    const selected = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });

    if (selected.canceled || selected.assets.length === 0) return;

    setIsOcrLoading(true);
    try {
      const result = await recognizeText(selected.assets[0].uri);
      const detectedText = result.full_text.trim();
      setOcrText(detectedText);
      setText(detectedText);
      if (!detectedText) {
        setOcrError("No readable text was found in this image.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR failed for this image.";
      setOcrError(message);
    } finally {
      setIsOcrLoading(false);
    }
  }

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Analyze Message</Text>
        <Text style={sharedStyles.body}>
          Pick a screenshot or paste a message. OCR and rules run on this device.
        </Text>

        <PrimaryButton
          title={isOcrLoading ? "Reading Screenshot..." : "Pick Screenshot"}
          onPress={pickScreenshot}
          disabled={isOcrLoading}
        />
        {ocrError ? <Text style={styles.errorText}>{ocrError}</Text> : null}

        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder="Paste or type a suspicious message here"
          placeholderTextColor="#64748b"
          style={styles.input}
          textAlignVertical="top"
        />

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Demo messages</Text>
          {demoMessages.map((message) => (
            <Pressable key={message} onPress={() => setText(message)} style={styles.demoButton}>
              <Text style={styles.demoText}>{message}</Text>
            </Pressable>
          ))}
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Detected Text</Text>
          <Text style={styles.detectedText}>{ocrText || "No OCR text yet"}</Text>
        </View>

        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Detected Signals</Text>
          {signalResult.signals.length > 0 ? (
            <View style={styles.signalWrap}>
              {signalResult.signals.map((signal) => (
                <View key={signal} style={styles.signalChip}>
                  <Text style={styles.signalText}>✓ {signal}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={sharedStyles.body}>No signals yet</Text>
          )}
        </View>

        <View style={[sharedStyles.card, { borderColor: gateStyle.borderColor }]}>
          <Text style={sharedStyles.cardTitle}>Initial Safety Gate</Text>
          <Text
            style={[
              styles.gate,
              { backgroundColor: gateStyle.backgroundColor, color: gateStyle.color },
            ]}
          >
            {signalResult.base_risk.toUpperCase()}
          </Text>
          <Text style={styles.note}>Rules extract evidence. Gemma 4 will reason over this evidence.</Text>
        </View>

        <PrimaryButton
          title="Analyze with TrustShield AI"
          onPress={analyze}
          disabled={!text.trim() || isOcrLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 150,
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 18,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 18,
    lineHeight: 26,
    padding: 16,
  },
  demoButton: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  demoText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 23,
  },
  detectedText: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 26,
  },
  signalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  signalChip: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signalText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  gate: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 17,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  note: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
});
