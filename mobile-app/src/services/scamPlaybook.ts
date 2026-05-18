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
    id: "fake_bank_account_blocked_warning",
    title: "Fake bank account blocked warning",
    risk_level: "dangerous",
    scam_type: "bank_account_blocked_phishing",
    match_signals: [
      "bank_impersonation",
      "account_blocked_threat",
      "urgent_action",
      "unknown_url",
      "external_action_request",
    ],
    match_keywords: ["account blocked", "suspended", "verify account", "kyc", "mobile banking", "internet banking"],
    explanation:
      "Scammers pretend a bank account is blocked so users verify through a fake link or share private details.",
    safe_action: "Do not use the message link. Open the official banking app or call the bank's official number.",
    user_checklist: [
      "Open the bank app manually.",
      "Do not enter login details from a message link.",
      "Call the bank using the official number printed on the card or website.",
    ],
  },
  {
    id: "fake_kyc_update_scam",
    title: "Fake KYC update scam",
    risk_level: "dangerous",
    scam_type: "fake_kyc_update_scam",
    match_signals: ["kyc_update_request", "bank_impersonation", "unknown_url", "sensitive_action_request"],
    match_keywords: ["kyc update", "update kyc", "verify kyc", "account verification", "nic", "passport"],
    explanation:
      "Fake KYC messages try to collect banking, identity, or login details through a link or form.",
    safe_action: "Do not submit details from the message. Verify KYC only inside the official bank app or branch.",
    user_checklist: [
      "Do not upload NIC or bank details from a message link.",
      "Check the official bank app or branch.",
      "Call the bank using an official number if the account warning worries you.",
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
    id: "customs_parcel_fee_scam",
    title: "Customs parcel fee scam",
    risk_level: "dangerous",
    scam_type: "customs_parcel_fee_scam",
    match_signals: ["customs_fee_request", "delivery_fee_request", "payment_request", "unknown_url"],
    match_keywords: ["customs", "parcel held", "clearance fee", "import duty", "delivery tax", "shipping fee"],
    explanation:
      "Fake customs or parcel messages ask for fees before release, often through unsafe payment links.",
    safe_action: "Do not pay from the message. Check the courier or customs notice through official channels.",
    user_checklist: [
      "Check tracking directly on the courier website or app.",
      "Do not enter card details from the message.",
      "Verify customs fees through official sources before paying.",
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
    id: "part_time_task_rating_job_scam",
    title: "Part-time task or rating job scam",
    risk_level: "dangerous",
    scam_type: "part_time_task_job_scam",
    match_signals: ["task_job_offer", "job_offer_unrealistic", "payment_request", "registration_fee"],
    match_keywords: ["part time", "rating job", "like videos", "complete tasks", "telegram job", "daily profit"],
    explanation:
      "Task job scams pay small rewards first, then ask for deposits or fees to unlock larger earnings.",
    safe_action: "Do not deposit money for online tasks. Verify the employer outside the chat or message.",
    user_checklist: [
      "Be careful if a job asks for deposits.",
      "Do not trust guaranteed daily income claims.",
      "Check the company independently before sharing details.",
    ],
  },
  {
    id: "loan_approval_fee_scam",
    title: "Loan approval fee scam",
    risk_level: "dangerous",
    scam_type: "loan_approval_fee_scam",
    match_signals: ["loan_offer", "loan_approval_fee", "payment_request"],
    match_keywords: ["loan approved", "instant loan", "processing fee", "approval fee", "quick cash"],
    explanation:
      "Fake loan messages promise fast approval and ask for an upfront processing or approval fee.",
    safe_action: "Do not pay loan fees from a message. Use licensed banks or finance companies only.",
    user_checklist: [
      "Check whether the lender is licensed.",
      "Do not pay an upfront approval fee.",
      "Avoid sending NIC or bank details through chat links.",
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
    id: "investment_double_money_scam",
    title: "Investment or double-money scam",
    risk_level: "dangerous",
    scam_type: "investment_profit_scam",
    match_signals: ["investment_profit_promise", "guaranteed_profit_claim", "payment_request"],
    match_keywords: ["double your money", "guaranteed profit", "daily return", "investment plan", "deposit now"],
    explanation:
      "Scammers promise guaranteed profit or doubled money to make users deposit funds quickly.",
    safe_action: "Do not send money. Check investment offers with a licensed financial adviser or regulator.",
    user_checklist: [
      "Be suspicious of guaranteed profit.",
      "Do not deposit money through chat or message links.",
      "Check whether the company is registered and regulated.",
    ],
  },
  {
    id: "crypto_profit_scam",
    title: "Crypto profit scam",
    risk_level: "dangerous",
    scam_type: "crypto_profit_scam",
    match_signals: ["crypto_profit_promise", "guaranteed_profit_claim", "payment_request"],
    match_keywords: ["crypto", "bitcoin", "usdt", "binance", "profit daily", "trading signal"],
    explanation:
      "Crypto scams use profit promises and urgency to collect deposits or wallet details.",
    safe_action: "Do not transfer crypto or money from the message. Verify any platform independently.",
    user_checklist: [
      "Do not share wallet keys or recovery phrases.",
      "Avoid guaranteed crypto profit claims.",
      "Check the platform outside the message.",
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
    id: "phishing_login_page_link",
    title: "Phishing login page link",
    risk_level: "dangerous",
    scam_type: "phishing_login_page_link",
    match_signals: ["phishing_login_page", "unknown_url", "password_request", "external_action_request"],
    match_keywords: ["login", "sign in", "verify account", "password", "secure portal", "update details"],
    explanation:
      "Phishing links imitate login pages to steal passwords, OTPs, or account details.",
    safe_action: "Do not log in through the message. Type the official website address or use the official app.",
    user_checklist: [
      "Do not enter passwords from a message link.",
      "Check the domain carefully.",
      "Use the official app or typed website address.",
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
    id: "tax_revenue_fine_payment_scam",
    title: "Tax, revenue, or fine payment scam",
    risk_level: "dangerous",
    scam_type: "tax_or_fine_payment_scam",
    match_signals: ["tax_fine_payment_request", "government_impersonation", "payment_request", "urgent_action"],
    match_keywords: ["tax", "revenue", "fine", "penalty", "court", "police fine", "pay now"],
    explanation:
      "Scammers impersonate authorities and threaten fines or penalties to force quick payment.",
    safe_action: "Do not pay from the message. Verify through the official office, website, or known phone number.",
    user_checklist: [
      "Check the official government or police channel.",
      "Do not pay through unknown links.",
      "Ask a trusted person before responding to threats.",
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
    id: "sim_upgrade_verification_scam",
    title: "SIM upgrade or verification scam",
    risk_level: "dangerous",
    scam_type: "sim_upgrade_verification_scam",
    match_signals: ["sim_upgrade_request", "telco_offer_claim", "otp_request", "sensitive_action_request"],
    match_keywords: ["sim upgrade", "sim verification", "4g upgrade", "5g upgrade", "connection suspend", "reload pin"],
    explanation:
      "SIM verification scams pretend to be telcos and ask for codes or details to take over accounts.",
    safe_action: "Do not share verification codes. Visit the official telco app, outlet, or hotline.",
    user_checklist: [
      "Never share SMS verification codes.",
      "Use the official telco app or outlet.",
      "Do not follow SIM upgrade links from unknown messages.",
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
    id: "fake_refund_cashback_scam",
    title: "Fake refund or cashback scam",
    risk_level: "dangerous",
    scam_type: "fake_refund_or_cashback_scam",
    match_signals: ["refund_or_cashback_claim", "payment_request", "unknown_url", "sensitive_action_request"],
    match_keywords: ["refund", "cashback", "reversal", "claim refund", "card details", "bank details"],
    explanation:
      "Refund scams offer money back, then ask for card, bank, login, or payment details.",
    safe_action: "Do not enter card or bank details from the message. Check refunds inside the official app.",
    user_checklist: [
      "Check refunds in the official app or statement.",
      "Do not share card details to receive money.",
      "Call the company using an official contact if unsure.",
    ],
  },
  {
    id: "facebook_marketplace_advance_payment_scam",
    title: "Marketplace advance payment scam",
    risk_level: "dangerous",
    scam_type: "marketplace_advance_payment_scam",
    match_signals: ["marketplace_advance_payment", "advance_payment_request", "payment_request"],
    match_keywords: ["facebook marketplace", "advance payment", "reserve item", "courier payment", "deposit first"],
    explanation:
      "Marketplace scammers ask for deposits, courier fees, or advance payments before the item is verified.",
    safe_action: "Do not pay in advance to unknown sellers or buyers. Meet safely and verify the item first.",
    user_checklist: [
      "Avoid deposits to unknown people.",
      "Verify the item and seller before payment.",
      "Use safer marketplace payment methods where available.",
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
      "customs_fee_request",
      "fake_gift_card_offer",
      "high_value_reward",
      "kyc_update_request",
      "sim_upgrade_request",
      "loan_approval_fee",
      "tax_fine_payment_request",
      "advance_payment_request",
      "marketplace_advance_payment",
      "phishing_login_page",
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
