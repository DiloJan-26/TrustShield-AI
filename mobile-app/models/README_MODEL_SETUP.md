# TrustShield AI Model Setup

Model: Gemma 4 E2B instruction LiteRT-LM

Expected file name:

```text
gemma-4-E2B-it.litertlm
```

Expected app-readable phone path:

```text
/sdcard/Android/data/com.djexpo119.trustshieldai/files/models/gemma-4-E2B-it.litertlm
```

Do not commit the model file to GitHub.

Approx file size: about 2.6 GB.

ADB setup command:

```powershell
adb shell mkdir -p /sdcard/Android/data/com.djexpo119.trustshieldai/files/models
adb push gemma-4-E2B-it.litertlm /sdcard/Android/data/com.djexpo119.trustshieldai/files/models/gemma-4-E2B-it.litertlm
```

If the model was already copied to shared storage, move it into the app-readable path:

```powershell
adb shell mkdir -p /sdcard/Android/data/com.djexpo119.trustshieldai/files/models
adb shell cp /sdcard/TrustShieldAI/models/gemma-4-E2B-it.litertlm /sdcard/Android/data/com.djexpo119.trustshieldai/files/models/gemma-4-E2B-it.litertlm
```
