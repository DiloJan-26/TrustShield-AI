# Safe Link Preview

TrustShield separates QR links from visible message links so the app can explain where a risky URL came from.

## How It Works

- Local URL intelligence runs automatically without internet.
- QR Safe Preview appears for QR/barcode links.
- URL Safety Preview appears for visible or manually pasted message links when no QR preview is active.
- Safe Link Preview is optional and needs internet.
- The app fetches only limited public metadata.
- The app does not open the site.
- The app does not use WebView.
- The app does not run JavaScript.
- The app does not click, submit, log in, or download files.
- The app does not send the user's message to cloud AI.
- Gemma 4 E2B still reasons locally on device.
- If internet is off, local analysis still works.

## Privacy Note

Default analysis is local. Safety Preview may contact the link destination only when the user taps the preview button.

## Safety Note

Do not use preview for private or personal links with tokens if the user is concerned. Use official apps or official websites manually.
