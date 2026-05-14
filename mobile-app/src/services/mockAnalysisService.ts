import { extractScamSignals, type ScamSignalResult } from "./scamSignalExtractor";
import type { TrustShieldResult } from "../types/analysis";

function fallbackEvidence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return ["No message text was provided."];
  return ["No strong scam signals were found in this Day 2 signal check."];
}

export function analyzeMockMessage(
  text: string,
  signalResult: ScamSignalResult = extractScamSignals(text),
): TrustShieldResult {
  const evidence =
    signalResult.evidence.length > 0 ? signalResult.evidence : fallbackEvidence(text);

  if (signalResult.base_risk === "dangerous") {
    return {
      risk_level: "dangerous",
      confidence: 0.94,
      scam_type: signalResult.scam_type_hint,
      evidence,
      simple_warning:
        "This message looks dangerous. Do not open links, share codes, install apps, or send money.",
      tamil_warning:
        "இந்த செய்தி ஆபத்தானதாக இருக்கலாம். இணைப்புகளை திறக்காதீர்கள், குறியீடுகளை பகிராதீர்கள், பணம் அனுப்பாதீர்கள்.",
      safe_action:
        "Stop now. Verify using the official app, official phone number, or a trusted family member.",
      family_alert:
        "TrustShield AI found a risky message. Please help check it before any link is opened, code is shared, app is installed, or money is sent.",
    };
  }

  if (signalResult.base_risk === "suspicious") {
    return {
      risk_level: "suspicious",
      confidence: 0.76,
      scam_type: signalResult.scam_type_hint,
      evidence,
      simple_warning:
        "This message needs checking. It may be safe, but the request has suspicious signs.",
      tamil_warning:
        "இந்த செய்தியை சரிபார்க்க வேண்டும். கோரிக்கையில் சந்தேகமான அறிகுறிகள் உள்ளன.",
      safe_action:
        "Do not rush. Confirm the sender using a known phone number or official channel.",
      family_alert:
        "TrustShield AI marked this message as suspicious. Please review it before the user takes action.",
    };
  }

  return {
    risk_level: "safe",
    confidence: 0.88,
    scam_type: signalResult.scam_type_hint,
    evidence,
    simple_warning:
      "No clear scam pattern was detected. Continue carefully with unexpected messages.",
    tamil_warning:
      "தெளிவான மோசடி அறிகுறி இல்லை. எதிர்பாராத செய்திகளை கவனமாக சரிபார்க்கவும்.",
    safe_action:
      "You can continue, but verify any unexpected financial or account message.",
    family_alert:
      "TrustShield AI did not find a clear scam pattern, but please verify if the message feels unexpected.",
  };
}
