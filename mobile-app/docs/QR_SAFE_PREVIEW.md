# QR Safe Preview

QR links are hidden until scanned. TrustShield separates QR/barcode URLs from visible message URLs so a QR destination can be treated as its own signal during analysis.

This QR-specific page is now part of the unified Safe Link Preview flow. See `SAFE_LINK_PREVIEW.md` for the shared QR and normal URL behavior.

## Local URL Intelligence

Local URL intelligence runs without internet. It checks the QR URL format, domain, protocol, suspicious TLDs, short links, trusted domains, possible brand impersonation, and risky path words such as login, verify, claim, reward, payment, OTP, KYC, and free-data.

## Optional Internet Preview

QR Safe Preview is optional and needs internet. It contacts the QR destination only when the user taps **Check QR Safely**.

The preview:

- Fetches only limited public metadata.
- Does not open the site in a browser.
- Does not use WebView.
- Does not run JavaScript.
- Does not click links or buttons.
- Does not submit forms.
- Does not log in.
- Does not download files.
- Does not send cookies or authorization headers.
- Does not send the user's message to cloud AI.

Gemma 4 E2B still reasons locally on device. If internet is off, local QR analysis and Gemma analysis still work.

## Privacy Note

Default TrustShield analysis is local. QR Safe Preview may contact the QR destination only after the user taps the preview button.

## Safety Note

Do not use preview for private or personal links with tokens if the user is concerned. For banking, telco, delivery, and prize messages, use official apps or official websites manually.
