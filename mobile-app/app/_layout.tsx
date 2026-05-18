import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import {
  isNotificationPermissionGranted,
  requestNotificationPermission,
  showQuickNotification,
} from '../src/native/TrustShieldQuickNotification';
import { getInitialSharedImage } from '../src/native/TrustShieldShareReceiver';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function enableQuickAccess() {
      try {
        const alreadyGranted = await isNotificationPermissionGranted();
        const permission = alreadyGranted
          ? { granted: true }
          : await requestNotificationPermission();

        if (isMounted && permission.granted) {
          await showQuickNotification();
        }
      } catch {
        // Native module may not exist until the custom dev client is rebuilt.
      }
    }

    enableQuickAccess();

    async function routePendingShare() {
      try {
        const shared = await getInitialSharedImage();
        if (isMounted && shared.imageUri) {
          router.replace('/analyze' as never);
        }
      } catch {
        // Share receiver may not exist until the custom dev client is rebuilt.
      }
    }

    routePendingShare();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        enableQuickAccess();
        routePendingShare();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="analyze" />
        <Stack.Screen name="result" />
        <Stack.Screen name="scam-report" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
