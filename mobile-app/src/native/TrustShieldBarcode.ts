import { NativeModules, Platform } from "react-native";

export type BarcodeResultItem = {
  raw_value: string;
  display_value?: string;
  format?: string;
  value_type?: string;
};

export type BarcodeScanResult = {
  barcodes: BarcodeResultItem[];
  raw_values: string[];
};

type TrustShieldBarcodeModule = {
  scanBarcodes(imageUri: string): Promise<BarcodeScanResult>;
  scanCodeWithCamera(): Promise<BarcodeScanResult>;
};

const nativeModule = NativeModules.TrustShieldBarcode as TrustShieldBarcodeModule | undefined;

export async function scanBarcodes(imageUri: string): Promise<BarcodeScanResult> {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield barcode scanning is currently available only on Android.");
  }

  if (!nativeModule?.scanBarcodes) {
    throw new Error("TrustShield barcode native module is not available. Rebuild the custom dev client.");
  }

  return nativeModule.scanBarcodes(imageUri);
}

export async function scanCodeWithCamera(): Promise<BarcodeScanResult> {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield QR detection is currently available only on Android.");
  }

  if (!nativeModule?.scanCodeWithCamera) {
    throw new Error("TrustShield QR camera scanner is not available. Rebuild the custom dev client.");
  }

  return nativeModule.scanCodeWithCamera();
}
