import { NativeModules, Platform } from "react-native";

export type NotificationPermissionResult = {
  granted: boolean;
  message: string;
};

export type ShowQuickNotificationResult = {
  shown: boolean;
  message: string;
};

export type CancelQuickNotificationResult = {
  cancelled: boolean;
  message: string;
};

type TrustShieldQuickNotificationModule = {
  requestNotificationPermission(): Promise<NotificationPermissionResult>;
  showQuickNotification(): Promise<ShowQuickNotificationResult>;
  cancelQuickNotification(): Promise<CancelQuickNotificationResult>;
  isNotificationPermissionGranted(): Promise<boolean>;
};

const nativeModule = NativeModules.TrustShieldQuickNotification as
  | TrustShieldQuickNotificationModule
  | undefined;

function requireQuickNotificationModule(): TrustShieldQuickNotificationModule {
  if (Platform.OS !== "android") {
    throw new Error("TrustShield quick notification is currently available only on Android.");
  }

  if (
    !nativeModule?.requestNotificationPermission ||
    !nativeModule?.showQuickNotification ||
    !nativeModule?.cancelQuickNotification ||
    !nativeModule?.isNotificationPermissionGranted
  ) {
    throw new Error(
      "TrustShield quick notification native module is not available. Rebuild the custom dev client.",
    );
  }

  return nativeModule;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  return requireQuickNotificationModule().requestNotificationPermission();
}

export async function showQuickNotification(): Promise<ShowQuickNotificationResult> {
  return requireQuickNotificationModule().showQuickNotification();
}

export async function cancelQuickNotification(): Promise<CancelQuickNotificationResult> {
  return requireQuickNotificationModule().cancelQuickNotification();
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  return requireQuickNotificationModule().isNotificationPermissionGranted();
}
