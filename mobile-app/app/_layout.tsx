import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import {
  isNotificationPermissionGranted,
  requestNotificationPermission,
  showQuickNotification,
} from '../src/native/TrustShieldQuickNotification';

export default function RootLayout() {
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

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        enableQuickAccess();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="analyze" />
        <Stack.Screen name="result" />
        <Stack.Screen name="family-alert" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
