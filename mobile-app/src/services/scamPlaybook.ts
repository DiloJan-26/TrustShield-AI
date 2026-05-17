import type { RiskLevel, TrustShieldPlaybookItem } from "./model/modelTypes";

export type ScamPlaybookEntry = {
  id: string;
  title: string;
  risk_level: RiskLevel;
  scam_type: string;
  match_signals: string[];
  match_keywords: string[];
  explanation: string;
  safe_action: string;
  user_checklist: string[];
};

export type ScamPlaybookRetrievalInput = {
  text: string;
  signals: string[];
  urls: string[];
  scam_type_hint?: string;
  maxResults?: number;
};

export type CompactScamPlaybookEntry = TrustShieldPlaybookItem & {
  user_checklist: string[];
};

export const SCAM_PLAYBOOK: ScamPlaybookEntry[] = [
  {
    id: "fake_gift_card_prize_scam",
    title: "Fake gift card / prize scam",
    risk_level: "dangerous",
    scam_type: "fake_gift_card_or_reward_scam",
    match_signals: [
      "reward_offer",
      "fake_gift_card_offer",
      "click_link_request",
      "claim_prize_request",
      "time_limited_offer",
      "high_value_reward",
      "brand_impersonation",
    ],
    match_keywords: ["gift card", "free", "selected", "congratulations", "claim prize", "amazon", "winner", "prize"],
    explanation:
      "Scammers use fake brand rewards, large prizes, and urgency to make users click phishing links or share personal details.",
    safe_action: "Do not click the link. Visit the official brand website or app manually if needed.",
    user_checklist: [
      "Check if the offer appears in the official app or website.",
      "Check sender/source.",
      "Ask family before clicking.",
    ],
  },
  {
    id: "bank_otp_phishing",
    title: "Bank OTP phishing",
    risk_level: "dangerous",
    scam_type: "account_takeover_or_otp_scam",
    match_signals: ["otp_request", "bank_impersonation", "urgent_action", "account_blocked_threat"],
    match_keywords: ["bank", "otp", "verify", "blocked", "suspended", "mobile banking", "internet banking"],
    explanation: "Banks do not ask for OTP, PIN, CVV, or passwords through messages.",
    safe_action: "Do not reply or share OTP. Open the official banking app manually.",
    user_checklist: [
      "Check the official banking app manually.",
      "Do not share OTP, PIN, CVV, or password.",
      "Call the bank using the official number if worried.",
    ],
  },
  {
    id: "fake_delivery_fee_scam",
    title: "Fake delivery fee scam",
    risk_level: "dangerous",
    scam_type: "delivery_fee_scam",
    match_signals: ["delivery_fee_request", "payment_request", "unknown_url", "shortened_url"],
    match_keywords: ["parcel", "delivery fee", "courier", "held", "customs", "tracking"],
    explanation: "Fake parcel messages ask for small fees through unsafe links.",
    safe_action: "Check delivery only through the official courier app or website.",
    user_checklist: [
      "Check tracking in the courier app or website.",
      "Do not pay fees from message links.",
      "Verify the courier and tracking number.",
    ],
  },
  {
    id: "job_registration_fee_scam",
    title: "Job registration fee scam",
    risk_level: "dangerous",
    scam_type: "job_or_registration_fee_scam",
    match_signals: ["job_offer_unrealistic", "registration_fee", "payment_request"],
    match_keywords: ["work from home", "daily income", "registration fee", "processing fee"],
    explanation: "Scammers promise unrealistic earnings and ask for upfront fees.",
    safe_action: "Do not pay registration fees. Verify the employer independently.",
    user_checklist: [
      "Check the employer independently.",
      "Do not pay upfront registration or processing fees.",
      "Be careful with unrealistic daily income promises.",
    ],
  },
  {
    id: "qr_payment_or_hidden_link_scam",
    title: "QR payment or hidden link scam",
    risk_level: "dangerous",
    scam_type: "qr_payment_or_hidden_link_scam",
    match_signals: ["qr_payment_request", "qr_contains_payment_link", "payment_request", "unknown_url"],
    match_keywords: ["qr", "pay", "payment", "amount", "merchant", "transfer"],
    explanation: "QR codes can hide payment links or unknown destinations.",
    safe_action: "Do not pay or open QR links until verified.",
    user_checklist: [
      "Check who owns the QR code.",
      "Confirm amount and merchant before payment.",
      "Do not open unknown QR links.",
    ],
  },
  {
    id: "suspicious_short_link",
    title: "Suspicious shortened link",
    risk_level: "suspicious",
    scam_type: "suspicious_short_link",
    match_signals: ["shortened_url", "unknown_url"],
    match_keywords: ["bit.ly", "tinyurl", "t.co", "cutt.ly"],
    explanation: "Shortened links hide the real destination.",
    safe_action: "Do not open unless you trust the sender. Use official app/site manually.",
    user_checklist: [
      "Check sender/source.",
      "Avoid shortened links in unexpected messages.",
      "Use the official app or website manually.",
    ],
  },
  {
    id: "apk_install_malware",
    title: "APK install malware",
    risk_level: "dangerous",
    scam_type: "apk_install_malware",
    match_signals: ["apk_install_request", "unknown_url"],
    match_keywords: ["install apk", "download app", "update app", "security app"],
    explanation: "Unknown APKs can steal banking or messaging data.",
    safe_action: "Do not install APKs from messages or unknown links.",
    user_checklist: [
      "Install apps only from trusted app stores.",
      "Do not enable unknown sources for message links.",
      "Ask family before installing security or banking apps from links.",
    ],
  },
  {
    id: "whatsapp_account_takeover",
    title: "WhatsApp account takeover",
    risk_level: "dangerous",
    scam_type: "account_takeover_or_otp_scam",
    match_signals: ["whatsapp_code_request", "account_takeover_risk"],
    match_keywords: ["whatsapp code", "verification code", "6 digit code"],
    explanation: "Attackers ask for WhatsApp verification codes to take over accounts.",
    safe_action: "Never share WhatsApp verification codes.",
    user_checklist: [
      "Do not share any WhatsApp verification code.",
      "Contact the person separately if they asked for a code.",
      "Enable two-step verification in WhatsApp.",
    ],
  },
  {
    id: "fake_government_benefit_or_fee",
    title: "Fake government benefit or fee",
    risk_level: "dangerous",
    scam_type: "government_benefit_scam",
    match_signals: ["government_impersonation", "payment_request", "unknown_url"],
    match_keywords: ["government", "allowance", "benefit", "grant", "tax", "subsidy", "register"],
    explanation: "Scammers pretend to be official agencies and ask for money or details.",
    safe_action: "Verify only through official government websites or offices.",
    user_checklist: [
      "Check the official government website manually.",
      "Do not pay or register through message links.",
      "Verify at an official office if unsure.",
    ],
  },
  {
    id: "fake_telco_offer",
    title: "Fake telco offer",
    risk_level: "suspicious",
    scam_type: "telco_reward_or_data_offer",
    match_signals: ["telco_offer_claim", "unknown_url", "click_link_request", "urgent_expiry_claim"],
    match_keywords: ["dialog", "mobitel", "airtel", "hutch", "free data", "reload", "bonus data", "package"],
    explanation: "Telco offers can be real, but scam links may pretend to be official offers.",
    safe_action: "Check the official telco app or outlet. Do not claim through unknown links.",
    user_checklist: [
      "Open the official telco app manually.",
      "Check the offer at an official outlet if needed.",
      "Do not claim through unknown links.",
    ],
  },
  {
    id: "safe_telco_offer_notice",
    title: "Safe telco offer notice",
    risk_level: "safe",
    scam_type: "telco_reward_or_data_offer",
    match_signals: ["telco_offer_claim", "no_sensitive_request", "official_app_available"],
    match_keywords: ["data package", "bonus data", "offer", "app"],
    explanation:
      "A telco offer can be safe when it does not ask for OTP, payment, or unknown link clicks.",
    safe_action: "If interested, check inside the official telco app manually.",
    user_checklist: [
      "Use the official telco app.",
      "Do not share OTP or PIN.",
      "Ignore links if the sender is unclear.",
    ],
  },
  {
    id: "safe_transaction_notice",
    title: "Safe transaction notice",
    risk_level: "safe",
    scam_type: "no_clear_scam_pattern_detected",
    match_signals: ["safe_transaction_notice", "no_sensitive_request"],
    match_keywords: ["credited", "debited", "balance", "transaction"],
    explanation: "Normal transaction notices do not ask for OTP, payment, or link clicks.",
    safe_action: "No action needed unless you do not recognize the transaction.",
    user_checklist: [
      "Check the banking app if the transaction is unfamiliar.",
      "Do not share OTP or passwords.",
      "Call the bank from the official number if worried.",
    ],
  },
  {
    id: "safe_delivery_notice",
    title: "Safe delivery notice",
    risk_level: "safe",
    scam_type: "no_clear_scam_pattern_detected",
    match_signals: ["safe_delivery_notice", "no_sensitive_request"],
    match_keywords: ["delivered", "out for delivery", "tracking update"],
    explanation: "Safe delivery notices provide information without asking for payment or sensitive details.",
    safe_action: "No action needed unless details look unfamiliar.",
    user_checklist: [
      "Check courier app if details look unfamiliar.",
      "Do not pay from message links.",
      "Do not enter card details from a message.",
    ],
  },
  {
    id: "suspicious_unknown_offer",
    title: "Suspicious unknown offer",
    risk_level: "suspicious",
    scam_type: "possible_phishing_or_payment_scam",
    match_signals: ["unknown_sender", "external_action_request", "reward_offer"],
    match_keywords: ["offer", "claim", "limited", "selected", "special"],
    explanation: "Unclear offers from unknown senders should be verified before action.",
    safe_action: "Do not act through the message. Verify through an official source.",
    user_checklist: [
      "Check sender/source.",
      "Do not click or claim from the message.",
      "Ask family if the offer feels unusual.",
    ],
  },
];

function normalize(text: string) {
  return text.toLowerCase();
}

function isUrlOrQrEntry(entry: ScamPlaybookEntry): boolean {
  const joined = [...entry.match_signals, ...entry.match_keywords, entry.id].join(" ").toLowerCase();
  return /url|link|qr|payment|short/.test(joined);
}

function riskWeight(riskLevel: RiskLevel): number {
  if (riskLevel === "dangerous") return 3;
  if (riskLevel === "suspicious") return 1;
  return 0;
}

function hasDangerousSignals(signals: string[]): boolean {
  return signals.some((signal) =>
    [
      "otp_request",
      "pin_request",
      "password_request",
      "cvv_request",
      "whatsapp_code_request",
      "apk_install_request",
      "payment_request",
      "qr_payment_request",
      "qr_contains_payment_link",
      "registration_fee",
      "delivery_fee_request",
      "fake_gift_card_offer",
      "high_value_reward",
    ].includes(signal),
  );
}

export function retrieveScamPlaybookMatches(input: ScamPlaybookRetrievalInput): ScamPlaybookEntry[] {
  const maxResults = input.maxResults ?? 3;
  const loweredText = normalize(input.text);
  const signalSet = new Set(input.signals);
  const dangerousSignalsPresent = hasDangerousSignals(input.signals);

  return SCAM_PLAYBOOK.map((entry) => {
    const signalScore = entry.match_signals.reduce(
      (score, signal) => score + (signalSet.has(signal) ? 3 : 0),
      0,
    );
    const keywordScore = entry.match_keywords.reduce(
      (score, keyword) => score + (loweredText.includes(normalize(keyword)) ? 1 : 0),
      0,
    );
    const urlScore = input.urls.length > 0 && isUrlOrQrEntry(entry) ? 2 : 0;
    const scamTypeScore = input.scam_type_hint === entry.scam_type ? 2 : 0;
    const riskScore = dangerousSignalsPresent ? riskWeight(entry.risk_level) : 0;

    return {
      entry,
      score: signalScore + keywordScore + urlScore + scamTypeScore + riskScore,
    };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return riskWeight(b.entry.risk_level) - riskWeight(a.entry.risk_level);
    })
    .slice(0, maxResults)
    .map((item) => item.entry);
}

export function toCompactPlaybookForPrompt(
  entries: ScamPlaybookEntry[],
): CompactScamPlaybookEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    risk_level: entry.risk_level,
    scam_type: entry.scam_type,
    explanation: entry.explanation,
    safe_action: entry.safe_action,
    user_checklist: entry.user_checklist,
  }));
}
