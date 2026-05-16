import { NativeModules, Platform } from "react-native";

export type DocumentScanResult = {
  imageUris: string[];
  firstImageUri?: string;
  pageCount: number;
};

type TrustShieldDocumentScannerModule = {
  scanDocument(): Promise<DocumentScanResult>;
};

const nativeModule = NativeModules.TrustShieldDocumentScanner as
  | TrustShieldDocumentScannerModule
  | undefined;

export async function scanDocument(): Promise<DocumentScanResult> {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield document scanner is currently available only on Android.");
  }

  if (!nativeModule?.scanDocument) {
    throw new Error(
      "TrustShield document scanner native module is not available. Rebuild the custom dev client.",
    );
  }

  return nativeModule.scanDocument();
}
