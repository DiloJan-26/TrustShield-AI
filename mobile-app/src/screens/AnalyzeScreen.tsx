import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { demoMessages } from "../data/demoMessages";
import { sharedStyles } from "./sharedStyles";

export function AnalyzeScreen() {
  const router = useRouter();
  const [text, setText] = useState("");

  function analyze() {
    const message = text.trim();
    if (!message) return;
    router.push({ pathname: "/result", params: { text: message } } as never);
  }

  return (
    <SafeAreaView style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <Text style={sharedStyles.title}>Analyze Message</Text>
        <Text style={sharedStyles.body}>
          Day 1 demo uses mock Gemma-style analysis. OCR starts on Day 2.
        </Text>

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

        <PrimaryButton title="Analyze with TrustShield AI" onPress={analyze} />
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
});
