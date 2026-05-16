import type { TrustShieldModelInput } from "./modelTypes";
import { TRUSTSHIELD_MODEL_CONFIG } from "./modelConfig";

export function buildBaseGemmaPrompt(input: TrustShieldModelInput): string {
  const compactInput = {
    ocr_text: input.ocr_text.trim().slice(0, TRUSTSHIELD_MODEL_CONFIG.maxInputChars),
    detected_urls: input.detected_urls,
    detected_signals: input.detected_signals,
    base_risk: input.base_risk,
    evidence: input.evidence.slice(0, 4),
    scam_type_hint: input.scam_type_hint,
  };

return `TrustShield AI. Return JSON only. No markdown.
Classify OCR scam risk: safe, suspicious, dangerous.
Input may include visible OCR text and QR/barcode content extracted from the screenshot. Analyze only the provided text, URLs, and signals.
Dangerous if OTP/PIN/password/CVV/payment/QR/APK/WhatsApp code/urgent bank verify.
Suspicious if unknown link or unclear offer. Safe if no link, no OTP, no payment, no urgency.
Never advise clicking links, sharing OTP, installing APKs, or sending money.
JSON keys: risk_level, confidence, scam_type, evidence, simple_warning, safe_action, family_alert.
Input:
${JSON.stringify(compactInput)}`;
}
