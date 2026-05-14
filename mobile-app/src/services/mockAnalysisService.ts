import { extractScamSignals } from "./scamSignalExtractor";
import type { TrustShieldResult } from "../types/analysis";

const dangerousTerms = [
  "otp",
  "verify",
  "blocked",
  "give-away",
  "giveaway",
  "survey",
  ".store",
  "payment",
  "registration fee",
  "parcel",
  "delivery fee",
  "bank",
  "click link",
  "urgent",
  "won",
  "reward",
];

const suspiciousTerms = [
  "click",
  "link",
  "claim",
  "fee",
  "pay",
  "unknown",
  "limited",
  "offer",
  "earn",
];

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function fallbackEvidence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return ["No message text was provided"];
  return ["No strong scam signals were found in this Day 1 mock analysis"];
}

export function analyzeMockMessage(text: string): TrustShieldResult {
  const evidence = extractScamSignals(text);
  const hasDangerSignals = includesAny(text, dangerousTerms) || evidence.length >= 2;
  const hasSuspiciousSignals = includesAny(text, suspiciousTerms) || evidence.length === 1;

  if (hasDangerSignals) {
    const topEvidence = evidence.length > 0 ? evidence : ["Contains known scam keywords"];

    return {
      risk_level: "dangerous",
      confidence: 0.94,
      scam_type: "possible_phishing_or_reward_scam",
      evidence: topEvidence,
      simple_warning:
        "This message looks dangerous. Do not open links, share OTP codes, or send money.",
      tamil_warning:
        "இந்த செய்தி ஆபத்தானதாக இருக்கலாம். இணைப்புகளை திறக்காதீர்கள், OTP பகிராதீர்கள், பணம் அனுப்பாதீர்கள்.",
      safe_action:
        "Stop and verify using the official app, official website, or a trusted family member.",
      family_alert:
        "TrustShield AI found a risky message. Please help check it before any link is opened, OTP is shared, or money is sent.",
    };
  }

  if (hasSuspiciousSignals) {
    const topEvidence =
      evidence.length > 0
        ? evidence
        : ["Message asks the user to take action through a link or payment"];

    return {
      risk_level: "suspicious",
      confidence: 0.72,
      scam_type: "borderline_unknown_sender_or_money_request",
      evidence: topEvidence,
      simple_warning:
        "This message needs checking. It may be safe, but the request looks unusual.",
      tamil_warning:
        "இந்த செய்தியை சரிபார்க்க வேண்டும். இது பாதுகாப்பாக இருக்கலாம், ஆனால் கோரிக்கை சந்தேகமாக உள்ளது.",
      safe_action:
        "Do not rush. Confirm the sender through a known phone number or official channel.",
      family_alert:
        "TrustShield AI marked this message as suspicious. Please review it before the user takes action.",
    };
  }

  return {
    risk_level: "safe",
    confidence: 0.86,
    scam_type: "no_clear_scam_pattern_detected",
    evidence: fallbackEvidence(text),
    simple_warning:
      "No clear scam pattern was detected in this Day 1 mock analysis.",
    tamil_warning:
      "இந்த Day 1 மாதிரி பகுப்பாய்வில் தெளிவான மோசடி அறிகுறி கண்டறியப்படவில்லை.",
    safe_action:
      "You can continue, but always verify unexpected financial or account messages.",
    family_alert:
      "TrustShield AI did not find a clear scam pattern, but please verify if the message feels unexpected.",
  };
}
