import type { ModelMode } from "./modelTypes";

export const BASE_GEMMA_MODEL_PATH =
  "/sdcard/Android/data/com.djexpo119.trustshieldai/files/models/gemma-4-E2B-it.litertlm";

export const TRUSTSHIELD_MODEL_CONFIG = {
  v1EnglishOnly: true,
  maxInputChars: 700,
  maxOutputTokens: 128,
  temperature: 0.1,
};

let currentModelMode: ModelMode = "mock";
let gemmaRuntimeReady = false;
let gemmaRuntimeMessage = "";
let gemmaRuntimeLatency: number | null = null;
let gemmaRuntimeResponse = "";

export function getTrustShieldModelMode(): ModelMode {
  return currentModelMode;
}

export function setTrustShieldModelMode(mode: ModelMode) {
  currentModelMode = mode;
}

export function getTrustShieldModelModeLabel(mode: ModelMode = currentModelMode): string {
  return mode === "base_gemma" ? "Base Gemma 4 E2B" : "Mock Safety Mode";
}

export function getGemmaRuntimeState() {
  return {
    ready: gemmaRuntimeReady,
    message: gemmaRuntimeMessage,
    latency: gemmaRuntimeLatency,
    response: gemmaRuntimeResponse,
  };
}

export function markGemmaRuntimeReady(message: string) {
  gemmaRuntimeReady = true;
  gemmaRuntimeMessage = message;
  currentModelMode = "base_gemma";
}

export function markGemmaRuntimeError(message: string) {
  gemmaRuntimeReady = false;
  gemmaRuntimeMessage = message;
}

export function setGemmaRuntimeTestResult(response: string, latency: number | null) {
  gemmaRuntimeResponse = response;
  gemmaRuntimeLatency = latency;
}

export function disableGemmaRuntime() {
  gemmaRuntimeReady = false;
  gemmaRuntimeMessage = "Gemma disabled. Mock Safety Mode is active.";
  gemmaRuntimeLatency = null;
  gemmaRuntimeResponse = "";
  currentModelMode = "mock";
}
