# TrustShield AI Mobile App

Expo custom development client for the TrustShield AI Android app.

## USB Device Workflow

Use this workflow for physical Android devices such as Redmi Note 10 Pro and Samsung A50.

1. Connect the phone with USB debugging enabled.
2. Confirm the device is visible:

   ```powershell
   adb devices
   ```

3. Start Metro over USB in Terminal 1:

   ```powershell
   npm run start:usb
   ```

4. Build, install, and open the dev client in Terminal 2:

   ```powershell
   npm run android
   ```

After the native app is installed once, keep Terminal 1 running and press `r` in Metro to reload after JavaScript changes.

## Why USB Mode

The development client may try to load Metro from a LAN URL such as `192.168.x.x:8081`. On some phones or networks this can timeout. USB mode uses `adb reverse` and localhost mode so the phone reaches Metro through the USB cable.

## Useful Commands

```powershell
npm run lint
npx expo-doctor
adb reverse tcp:8081 tcp:8081
```

Use `npm run android:lan` only when the phone and laptop can reliably reach each other on the same Wi-Fi network.
