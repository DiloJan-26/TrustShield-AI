import { NativeModules, Platform } from "react-native";

export type OCRResult = {
  full_text: string;
  lines: string[];
  blocks: string[];
};

type TrustShieldOCRModule = {
  recognizeText(imageUri: string): Promise<OCRResult>;
};

const nativeModule = NativeModules.TrustShieldOCR as TrustShieldOCRModule | undefined;

export async function recognizeText(imageUri: string): Promise<OCRResult> {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield OCR is currently available only on Android.");
  }

  if (!nativeModule?.recognizeText) {
    throw new Error("TrustShield OCR native module is not available. Rebuild the custom dev client.");
  }

  return nativeModule.recognizeText(imageUri);
}
