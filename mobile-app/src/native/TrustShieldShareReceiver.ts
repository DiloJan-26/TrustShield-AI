import { NativeModules, Platform } from "react-native";

export type SharedImageResult = {
  imageUri?: string;
  mimeType?: string;
  source?: "android_share";
  message: string;
};

type TrustShieldShareReceiverModule = {
  getInitialSharedImage(): Promise<SharedImageResult>;
  clearSharedImage(): Promise<{ cleared: boolean }>;
  cleanupOldSharedImages(maxAgeHours: number): Promise<{ cleared: boolean }>;
};

const nativeModule = NativeModules.TrustShieldShareReceiver as
  | TrustShieldShareReceiverModule
  | undefined;

export async function getInitialSharedImage(): Promise<SharedImageResult> {
  if (Platform.OS !== "android") {
    return { message: "Share receiver is available only on Android." };
  }

  if (!nativeModule?.getInitialSharedImage) {
    return { message: "Share receiver is not available." };
  }

  return nativeModule.getInitialSharedImage();
}

export async function clearSharedImage(): Promise<{ cleared: boolean }> {
  if (Platform.OS !== "android" || !nativeModule?.clearSharedImage) {
    return { cleared: false };
  }

  return nativeModule.clearSharedImage();
}

export async function cleanupOldSharedImages(maxAgeHours = 24): Promise<{ cleared: boolean }> {
  if (Platform.OS !== "android" || !nativeModule?.cleanupOldSharedImages) {
    return { cleared: false };
  }

  return nativeModule.cleanupOldSharedImages(maxAgeHours);
}
