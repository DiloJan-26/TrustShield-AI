# TrustShield AI

**One Shield Before the Scam**

TrustShield AI is a privacy-first Android safety app that helps older adults and low-digital-literacy users understand suspicious messages, links, QR codes, and screenshots before they act on them. The app combines local OCR, QR/barcode extraction, deterministic scam signals, a curated Sri Lanka-focused scam playbook, and on-device Gemma 4 E2B reasoning.

The product goal is simple: explain scam risk in plain language before the user clicks a link, shares a code, installs an app, or sends money.

## Product Scope

TrustShield AI focuses on common scam interactions seen in SMS, WhatsApp, email screenshots, browser pages, QR/payment screens, and shared images.

The app can:

- Analyze pasted message text.
- Pick a screenshot from the gallery and extract visible text locally.
- Detect QR/barcode content from screenshots.
- Scan live QR/barcodes.
- Receive shared images from the Android share sheet.
- Separate visible-text URLs from QR/barcode URLs.
- Run optional QR Safe Preview / URL Safety Preview without opening the website.
- Detect scam signals such as OTP requests, fake bank warnings, delivery fees, fake rewards, SIM verification, KYC updates, job/task scams, loan fees, crypto/investment claims, APK install requests, government/tax/fine threats, and marketplace advance-payment scams.
- Retrieve top matching local scam patterns from a compact playbook.
- Run local Gemma 4 E2B reasoning through LiteRT-LM.
- Show an elder-friendly result with risk, confidence, explanation, evidence, safest action, model/privacy details, and a Scam State Report flow.

The app does not:

- Use cloud AI.
- Use Gemini API, OpenAI API, or a server fallback.
- Bundle the Gemma model inside the APK.
- Use Tesseract.
- Automatically capture screenshots.
- Use AccessibilityService or MediaProjection.
- Directly integrate with WhatsApp/Gmail account data.

## Privacy And Safety

TrustShield AI is designed for local-first safety.

- OCR runs on-device with Google ML Kit Text Recognition.
- QR/barcode extraction runs on-device with ML Kit / Google Code Scanner.
- Scam signal extraction runs locally in TypeScript.
- Scam playbook retrieval is local and offline.
- Gemma 4 E2B runs locally on the Android device through LiteRT-LM.
- The model file is external and must be copied manually after APK installation.
- The APK does not include `gemma-4-E2B-it.litertlm`.

Safe Link Preview is optional and user-triggered. It checks limited public website metadata without opening a browser, WebView, JavaScript, forms, or downloads. Unsafe schemes and local/private targets are blocked.

## Runtime Architecture

```text
User input
  -> Paste text / Pick screenshot / Detect QR / Android share image
  -> Local OCR and QR/barcode extraction
  -> URL source separation
  -> Local URL intelligence
  -> Optional Safe Link Preview
  -> Scam Signal Extractor
  -> Local Scam Playbook retrieval
  -> Compact Gemma 4 E2B prompt
  -> JSON parser and safety normalization
  -> Elder-friendly Result screen
  -> Scam State Report when risky
```

### Reasoning Layers

**Extraction layer**

Native Android modules extract visible Latin-script text, QR content, barcode values, and shared-image content. This layer does not call cloud OCR.

**Signal layer**

`scamSignalExtractor.ts` turns observable clues into structured signals and evidence. It also computes a conservative base risk before model reasoning.

**Playbook layer**

`scamPlaybook.ts` stores curated scam patterns. The local retriever selects only the top matching patterns, so the Gemma prompt stays small and fast.

**Model layer**

Gemma receives compact context only:

- Trimmed OCR/QR text
- Top detected URLs
- Top signals
- Rule risk hint
- Local evidence
- Scam type hint
- Top 1-3 compact playbook matches
- Optional safe preview metadata

The app does not send the full playbook or full datasets to the model.

**Parser and fallback layer**

The parser normalizes model JSON, calibrates confidence, filters unsafe advice, and applies conservative fallback behavior when model output is missing, malformed, or unsafe.

TrustShield never advises users to click unknown links, share OTP/PIN/password/CVV, install APKs from messages, send money, pay first, or reply with verification codes.

## Main App Flow

```text
Home
  -> Analyze Message
  -> Detect QR / Pick Screenshot / Paste Text / Android Share Image
  -> OCR + QR extraction
  -> URL source separation
  -> Local URL intelligence
  -> Optional QR Safe Preview / URL Safety Preview
  -> Signal extraction
  -> Local playbook retrieval
  -> Local Gemma reasoning
  -> Result
  -> Scam State Report if risky
```

## Repository Structure

```text
TrustShield-AI/
  mobile-app/
    app/                         Expo Router routes
    src/
      components/                Shared UI components
      native/                    TypeScript native-module bridges
      screens/                   Home, Analyze, Result, Settings, Report, Help
      services/                  OCR/QR context, signals, playbook, URL safety, model client
      types/                     Shared analysis/result types
    android/                     Native Android project and Kotlin modules
    assets/                      Icons and splash assets
    docs/                        Architecture and safety docs
    models/                      Model setup documentation only
    eas.json                     EAS APK build profile
    .easignore                   Mobile-app upload exclusions
  dataset/                       Dataset/research assets, not runtime app upload
  evaluation/                    Evaluation notes/results
  fine-tuning/                   Research/fine-tuning workspace
  website/                       Project website assets
```


Install dependencies:

```powershell
npm install
```

Run Metro for a physical Android device over USB:

```powershell
npm run start:usb
```

If the custom dev client does not open automatically, press:

```text
a
```

Use native rebuild only after Android/Kotlin/Gradle/manifest/native-module changes:

```powershell
npm run android
npm run start:usb
```

JavaScript/TypeScript-only changes usually need only:

```powershell
npm run start:usb
```

## Validation

Run before important builds:

```powershell
npx tsc --noEmit
npm run lint
```

Native Kotlin validation, when native files change:

```powershell
cd TrustShield-AI\mobile-app\android
.\gradlew.bat :app:compileDebugKotlin
```


Start a production-style internal APK build:

```powershell
cd TrustShield-AI\mobile-app
eas build -p android --profile preview-apk
```

## Installing The APK

After EAS Build finishes:

1. Open the Expo build page.
2. Click **Install** or download the APK from the build menu.
3. On Android 8.0+ allow APK installation from the browser or file manager if prompted.
4. Install the APK on the phone.[`Install APK`](https://expo.dev/accounts/djexpo119/projects/trustshield-ai/builds/ac70514d-dbc4-454f-aed2-f14350e26c1b)
5. Copy the Gemma model manually after installation.

## Gemma Model Setup

The model is not committed, not uploaded to EAS, and not bundled inside the APK.

Expected model file:

```text
gemma-4-E2B-it.litertlm
```

Expected app-readable phone path:

```text
/sdcard/Android/data/com.djexpo119.trustshieldai/files/models/gemma-4-E2B-it.litertlm
```

## Documentation

Additional documentation:

```text
mobile-app/docs/TRUSTSHIELD_REASONING_ARCHITECTURE.md
mobile-app/docs/SCAM_HELP_AND_SAFETY.md
mobile-app/docs/SAFE_LINK_PREVIEW.md
mobile-app/docs/QR_SAFE_PREVIEW.md
mobile-app/models/README_MODEL_SETUP.md
```

## Production Notes

- The app is intentionally local-first and privacy-preserving.
- The APK requires the external Gemma model to be copied after installation for full local model reasoning.
- Mock Safety Mode and Local Safety Fallback remain available when the model is not ready.
- OCR support is currently focused on Latin-script text.
- Official contact details and safety guidance should be rechecked before public release.
- Scam pattern coverage should be evaluated against real Sri Lankan examples before final judging or deployment.
