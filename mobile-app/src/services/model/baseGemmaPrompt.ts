import type { TrustShieldModelInput } from "./modelTypes";
import { TRUSTSHIELD_MODEL_CONFIG } from "./modelConfig";

export function buildBaseGemmaPrompt(input: TrustShieldModelInput): string {
  const playbook = input.retrieved_playbook?.slice(0, 1).map((entry) => ({
    id: entry.id,
    risk: entry.risk_level,
    type: entry.scam_type,
  }));
  const compactInput = {
    text: input.ocr_text.trim().slice(0, TRUSTSHIELD_MODEL_CONFIG.maxInputChars),
    urls: input.detected_urls.slice(0, 3),
    signals: input.detected_signals.slice(0, 8),
    risk: input.rule_risk_hint ?? input.base_risk,
    ev: input.evidence.slice(0, 2),
    hint: input.scam_type_hint,
    playbook,
  };

return `JSON only. Classify scam risk for elder safety.
Use text, urls, signals, risk hint, and playbook. Final decision is yours.
Dangerous: OTP/PIN/password/CVV/code/APK/payment/QR pay/urgent bank verify or prize+claim/click+urgency/high value/brand.
Suspicious: unknown link or unclear offer. Safe: normal notice with no link/code/payment/urgency.
Never advise link clicks, sharing codes/passwords, APK installs, or money transfer.
Return one short JSON object only with keys r,c,t,x,a.
r is safe/suspicious/dangerous. c is your numeric confidence decimal from 0.55 to 0.95, never 0, 1, or percent. x and a max 25 words.
Input:
${JSON.stringify(compactInput)}`;
}
