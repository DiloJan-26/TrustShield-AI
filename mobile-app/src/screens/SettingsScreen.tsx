import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { generate as generateGemma, initialize as initializeGemma } from "../native/TrustShieldGemma";
import {
  BASE_GEMMA_MODEL_PATH,
  disableGemmaRuntime,
  getGemmaRuntimeState,
  getTrustShieldModelMode,
  getTrustShieldModelModeLabel,
  markGemmaRuntimeError,
  markGemmaRuntimeReady,
  setGemmaRuntimeTestResult,
  setTrustShieldModelMode,
} from "../services/model/modelConfig";
import type { ModelMode } from "../services/model/modelTypes";
import { sharedStyles } from "./sharedStyles";

const settings = [
  ["Privacy Mode", "ON"],
  ["Family Alert", "Enabled"],
  ["Language", "English V1"],
  ["Device Mode", "Demo Foundation Mode"],
];

const modelSettings = [
  ["Base Gemma 4 E2B", "Available after initialization"],
  ["Fine-tuned Gemma 4 E2B", "Coming later"],
  ["No cloud AI", "ON"],
];

export function SettingsScreen() {
  const [modelMode, setModelMode] = useState<ModelMode>(getTrustShieldModelMode());
  const initialRuntime = getGemmaRuntimeState();
  const [gemmaStatus, setGemmaStatus] = useState(initialRuntime.ready ? "Ready" : "Not initialized");
  const [gemmaMessage, setGemmaMessage] = useState(initialRuntime.message);
  const [isInitializingGemma, setIsInitializingGemma] = useState(false);
  const [isTestingGemma, setIsTestingGemma] = useState(false);
  const [gemmaResponse, setGemmaResponse] = useState(initialRuntime.response);
  const [gemmaLatency, setGemmaLatency] = useState<number | null>(initialRuntime.latency);
  const isGemmaReady = gemmaStatus === "Ready";

  const refreshRuntimeState = useCallback(() => {
    const runtime = getGemmaRuntimeState();
    setModelMode(getTrustShieldModelMode());
    setGemmaStatus(runtime.ready ? "Ready" : "Not initialized");
    setGemmaMessage(runtime.message);
    setGemmaResponse(runtime.response);
    setGemmaLatency(runtime.latency);
  }, []);

  useFocusEffect(refreshRuntimeState);

  function chooseModelMode(mode: ModelMode) {
    setTrustShieldModelMode(mode);
    setModelMode(mode);
    if (mode === "base_gemma" && !isGemmaReady) {
      setGemmaMessage("Initialize Gemma 4 E2B before using model analysis.");
    }
  }

  async function initializeBaseGemma() {
    setIsInitializingGemma(true);
    setGemmaStatus("Loading");
    setGemmaMessage("");
    setGemmaResponse("");
    setGemmaLatency(null);

    try {
      const result = await initializeGemma(BASE_GEMMA_MODEL_PATH);
      setGemmaStatus(result.ready ? "Ready" : "Error");
      const message = result.modelPath ? `${result.message}: ${result.modelPath}` : result.message;
      setGemmaMessage(message);
      if (result.ready) {
        markGemmaRuntimeReady(message);
        setModelMode("base_gemma");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error checking Gemma model.";
      setGemmaStatus("Error");
      setGemmaMessage(message);
      markGemmaRuntimeError(message);
    } finally {
      setIsInitializingGemma(false);
    }
  }

  function disableGemma() {
    disableGemmaRuntime();
    refreshRuntimeState();
  }

  async function testGemma() {
    const testPrompt =
      'Return valid JSON only:\n{"risk_level":"safe","confidence":0.8,"scam_type":"test","evidence":["test"],"simple_warning":"Test OK","safe_action":"No action","family_alert":""}';

    setIsTestingGemma(true);
    setGemmaResponse("");
    setGemmaLatency(null);

    try {
      const result = await generateGemma(testPrompt, { maxTokens: 128, temperature: 0.1 });
      setGemmaResponse(result.text);
      setGemmaLatency(result.latency_ms);
      setGemmaRuntimeTestResult(result.text, result.latency_ms);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gemma test generation failed.";
      setGemmaResponse(`Error: ${message}`);
      setGemmaRuntimeTestResult(`Error: ${message}`, null);
    } finally {
      setIsTestingGemma(false);
    }
  }

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
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Model</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Current reasoning mode</Text>
            <Text style={styles.value}>{getTrustShieldModelModeLabel(modelMode)}</Text>
          </View>
          <PrimaryButton
            title="Use Mock Safety Mode"
            onPress={() => chooseModelMode("mock")}
            variant={modelMode === "mock" ? "primary" : "secondary"}
          />
          <PrimaryButton
            title="Use Base Gemma 4 E2B"
            onPress={() => chooseModelMode("base_gemma")}
            variant={modelMode === "base_gemma" ? "primary" : "secondary"}
          />
          {modelSettings.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Gemma 4 E2B Model</Text>
          <Text style={styles.label}>Expected path:</Text>
          <Text style={styles.path}>{BASE_GEMMA_MODEL_PATH}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Model status</Text>
            <Text style={styles.value}>{gemmaStatus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Model</Text>
            <Text style={styles.value}>Base Gemma 4 E2B</Text>
          </View>
          <PrimaryButton
            title={isInitializingGemma ? "Loading..." : "Initialize Base Gemma 4 E2B"}
            onPress={initializeBaseGemma}
            disabled={isInitializingGemma || isTestingGemma}
          />
          <PrimaryButton
            title={isTestingGemma ? "Testing..." : "Test Gemma"}
            onPress={testGemma}
            variant="secondary"
            disabled={!isGemmaReady || isInitializingGemma || isTestingGemma}
          />
          <PrimaryButton
            title="Disable Gemma / Use Mock Safety Mode"
            onPress={disableGemma}
            variant="danger"
            disabled={isInitializingGemma || isTestingGemma}
          />
          {gemmaMessage ? <Text style={styles.status}>{gemmaMessage}</Text> : null}
          {gemmaLatency !== null ? (
            <Text style={styles.status}>Latency: {Math.round(gemmaLatency)} ms</Text>
          ) : null}
          {gemmaResponse ? (
            <View style={styles.outputBox}>
              <Text style={styles.label}>Raw model response</Text>
              <Text style={styles.outputText}>{gemmaResponse}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Cloud AI</Text>
            <Text style={styles.value}>Not used</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Runtime</Text>
            <Text style={styles.value}>On-device</Text>
          </View>
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
  path: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  status: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
  },
  outputBox: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  outputText: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
  },
});
