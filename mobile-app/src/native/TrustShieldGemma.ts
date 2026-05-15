import { NativeModules, Platform } from "react-native";

export type GemmaInitializeResult = {
  ready: boolean;
  message: string;
  modelPath?: string;
};

export type GemmaGenerateOptions = {
  maxTokens?: number;
  temperature?: number;
};

export type GemmaGenerateResult = {
  text: string;
  latency_ms: number;
};

type TrustShieldGemmaModule = {
  initialize(modelPath: string): Promise<GemmaInitializeResult>;
  isReady(): Promise<boolean>;
  generate(prompt: string, options?: GemmaGenerateOptions): Promise<GemmaGenerateResult>;
};

const nativeModule = NativeModules.TrustShieldGemma as TrustShieldGemmaModule | undefined;

function requireGemmaModule(): TrustShieldGemmaModule {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield Gemma is currently available only on Android.");
  }

  if (!nativeModule?.initialize || !nativeModule?.isReady || !nativeModule?.generate) {
    throw new Error("TrustShield Gemma native module is not available. Rebuild the custom dev client.");
  }

  return nativeModule;
}

export async function initialize(modelPath: string): Promise<GemmaInitializeResult> {
  return requireGemmaModule().initialize(modelPath);
}

export async function isReady(): Promise<boolean> {
  return requireGemmaModule().isReady();
}

export async function generate(
  prompt: string,
  options?: GemmaGenerateOptions,
): Promise<GemmaGenerateResult> {
  return requireGemmaModule().generate(prompt, options);
}
