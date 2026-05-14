export type BaseRisk = "safe" | "suspicious" | "dangerous";

export type ScamSignalResult = {
  urls: string[];
  signals: string[];
  base_risk: BaseRisk;
  evidence: string[];
  scam_type_hint: string;
};

const SHORTENER_PATTERN = /\b(?:bit\.ly|tinyurl\.com|shorturl\.at|t\.co|goo\.gl|ow\.ly|cutt\.ly|is\.gd|buff\.ly)\b/i;
const SUSPICIOUS_TLD_PATTERN = /\.(?:store|click|top|xyz|icu|online|shop|site)\b/i;

function normalize(text: string) {
  return text.toLowerCase();
}

function unique(items: string[]) {
  return [...new Set(items)];
}

export function extractUrls(text: string): string[] {
  return (
    text.match(
      /https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9.-]+\.(?:com|lk|store|net|org|click|top|xyz|icu|online|shop|site)\b[^\s]*/gi,
    ) ?? []
  );
}

export function detectOtpRequest(text: string): boolean {
  return /\botp\b|one[- ]?time password|verification code|security code|login code/i.test(text);
}

export function detectCredentialRequest(text: string): string[] {
  const lowered = normalize(text);
  const signals: string[] = [];

  if (/\bpin\b|atm pin|card pin/i.test(lowered)) signals.push("pin_request");
  if (/password|passcode|login details|credentials/i.test(lowered)) signals.push("password_request");
  if (/\bcvv\b|security number|card code/i.test(lowered)) signals.push("cvv_request");
  if (/whatsapp.*code|code.*whatsapp/i.test(lowered)) signals.push("whatsapp_code_request");

  return signals;
}

export function detectUrgency(text: string): boolean {
  return /urgent|now|immediately|blocked|suspend|locked|held|expire|limited time|final notice/i.test(text);
}

export function detectPaymentRequest(text: string): boolean {
  return /payment|pay|fee|send money|bank transfer|transfer now|deposit now|card details/i.test(text);
}

export function detectRewardScam(text: string): boolean {
  return /give-away|giveaway|won|reward|congratulations|claim|prize|winner|free gift/i.test(text);
}

export function detectDeliveryScam(text: string): boolean {
  return /parcel|delivery|courier|shipping|held|customs/i.test(text);
}

export function detectJobScam(text: string): boolean {
  return /work from home|earn\s+(?:rs\.?|lkr|\$)?\s?\d+|daily income|part[- ]time job|registration fee|easy job/i.test(text);
}

export function detectBankImpersonation(text: string): boolean {
  return /bank|atm|credit card|debit card/i.test(text) || /account/i.test(text) && /blocked|verify|otp|pin|password|suspend|locked/i.test(text);
}

export function detectGovernmentImpersonation(text: string): boolean {
  return /government|gov\.lk|police|tax|revenue|customs|immigration|court|fine/i.test(text);
}

export function detectSuspiciousDomain(urls: string[]): string[] {
  const signals: string[] = [];

  if (urls.length > 0) signals.push("unknown_url");
  if (urls.some((url) => SHORTENER_PATTERN.test(url))) signals.push("shortened_url");
  if (urls.some((url) => SUSPICIOUS_TLD_PATTERN.test(url))) signals.push("suspicious_tld");

  return signals;
}

export function detectApkInstall(text: string): boolean {
  return /\.apk\b|install app|download app|install this application|enable unknown sources/i.test(text);
}

export function detectQrPayment(text: string): boolean {
  return /qr payment|scan qr|qr code|scan and pay|pay by qr/i.test(text);
}

export function computeBaseRisk(signals: string[]): BaseRisk {
  const signalSet = new Set(signals);
  const dangerousSignals = [
    "otp_request",
    "pin_request",
    "password_request",
    "cvv_request",
    "account_blocked_threat",
    "registration_fee",
    "delivery_fee_request",
    "apk_install_request",
    "qr_payment_request",
    "whatsapp_code_request",
    "account_takeover_risk",
  ];

  if (dangerousSignals.some((signal) => signalSet.has(signal))) return "dangerous";
  if (
    signalSet.has("payment_request") &&
    (signalSet.has("unknown_url") || signalSet.has("shortened_url"))
  ) {
    return "dangerous";
  }

  const suspiciousSignals = [
    "unknown_url",
    "shortened_url",
    "suspicious_tld",
    "reward_offer",
    "survey_request",
    "urgent_action",
    "bank_impersonation",
    "government_impersonation",
    "job_offer_unrealistic",
    "loan_offer",
    "investment_profit_promise",
    "crypto_profit_promise",
  ];

  if (suspiciousSignals.some((signal) => signalSet.has(signal))) return "suspicious";
  return "safe";
}

function buildEvidence(signals: string[], urls: string[]): string[] {
  const evidence: string[] = [];

  if (urls.length > 0) evidence.push(`Found link: ${urls.join(", ")}`);
  if (signals.includes("otp_request")) evidence.push("Message asks for an OTP or verification code.");
  if (signals.includes("pin_request")) evidence.push("Message asks for a PIN.");
  if (signals.includes("password_request")) evidence.push("Message asks for a password or login details.");
  if (signals.includes("cvv_request")) evidence.push("Message asks for card CVV details.");
  if (signals.includes("bank_impersonation")) evidence.push("Message mentions bank or account details.");
  if (signals.includes("account_blocked_threat")) evidence.push("Message threatens account blocking or suspension.");
  if (signals.includes("urgent_action")) evidence.push("Message pushes urgent action.");
  if (signals.includes("unknown_url")) evidence.push("Message contains an unverified URL.");
  if (signals.includes("shortened_url")) evidence.push("Message uses a shortened URL.");
  if (signals.includes("suspicious_tld")) evidence.push("Message uses a suspicious domain ending.");
  if (signals.includes("reward_offer")) evidence.push("Message offers a prize, reward, or giveaway.");
  if (signals.includes("survey_request")) evidence.push("Message asks the user to complete a survey.");
  if (signals.includes("payment_request")) evidence.push("Message requests payment or money transfer.");
  if (signals.includes("registration_fee")) evidence.push("Message asks for a registration fee.");
  if (signals.includes("job_offer_unrealistic")) evidence.push("Message promises unrealistic job income.");
  if (signals.includes("delivery_fee_request")) evidence.push("Message asks for a parcel or delivery fee.");
  if (signals.includes("qr_payment_request")) evidence.push("Message asks for QR payment.");
  if (signals.includes("apk_install_request")) evidence.push("Message asks the user to install an APK/app.");
  if (signals.includes("government_impersonation")) evidence.push("Message appears to impersonate a government service.");
  if (signals.includes("loan_offer")) evidence.push("Message offers a loan or fast approval.");
  if (signals.includes("investment_profit_promise")) evidence.push("Message promises investment profit.");
  if (signals.includes("crypto_profit_promise")) evidence.push("Message promises crypto profit.");
  if (signals.includes("whatsapp_code_request")) evidence.push("Message asks for a WhatsApp code.");
  if (signals.includes("safe_transaction_notice")) evidence.push("Looks like a transaction notice without a sensitive request.");
  if (signals.includes("safe_delivery_notice")) evidence.push("Looks like a delivery notice without a payment or link request.");
  if (signals.includes("no_sensitive_request")) evidence.push("No OTP, password, payment, or risky link request found.");

  return evidence;
}

function getScamTypeHint(signals: string[], baseRisk: BaseRisk): string {
  if (signals.includes("otp_request") || signals.includes("whatsapp_code_request")) {
    return "account_takeover_or_otp_scam";
  }
  if (signals.includes("bank_impersonation")) return "bank_impersonation";
  if (signals.includes("delivery_fee_request")) return "delivery_fee_scam";
  if (signals.includes("job_offer_unrealistic")) return "job_or_registration_fee_scam";
  if (signals.includes("reward_offer")) return "reward_or_survey_scam";
  if (signals.includes("government_impersonation")) return "government_impersonation";
  if (signals.includes("investment_profit_promise") || signals.includes("crypto_profit_promise")) {
    return "investment_profit_scam";
  }
  if (baseRisk === "safe") return "no_clear_scam_pattern_detected";
  return "possible_phishing_or_payment_scam";
}

export function extractScamSignals(text: string): ScamSignalResult {
  const trimmed = text.trim();
  const lowered = normalize(trimmed);
  const urls = extractUrls(trimmed);
  const signals: string[] = [];

  if (detectOtpRequest(trimmed)) signals.push("otp_request");
  signals.push(...detectCredentialRequest(trimmed));
  if (detectBankImpersonation(trimmed)) signals.push("bank_impersonation");
  if (/blocked|suspend|locked|account.*hold|account.*verify/i.test(trimmed)) {
    signals.push("account_blocked_threat");
  }
  if (detectUrgency(trimmed)) signals.push("urgent_action");
  if (detectRewardScam(trimmed)) signals.push("reward_offer");
  if (/survey/i.test(trimmed)) signals.push("survey_request");
  if (detectPaymentRequest(trimmed)) signals.push("payment_request");
  if (/registration fee/i.test(trimmed)) signals.push("registration_fee");
  if (detectJobScam(trimmed)) signals.push("job_offer_unrealistic");
  if (detectDeliveryScam(trimmed) && /delivery fee|shipping fee|pay|payment/i.test(trimmed)) {
    signals.push("delivery_fee_request");
  }
  if (detectQrPayment(trimmed)) signals.push("qr_payment_request");
  if (detectApkInstall(trimmed)) signals.push("apk_install_request");
  if (detectGovernmentImpersonation(trimmed)) signals.push("government_impersonation");
  if (/loan|quick cash|instant approval/i.test(trimmed)) signals.push("loan_offer");
  if (/investment|double your money|guaranteed profit|profit daily/i.test(trimmed)) {
    signals.push("investment_profit_promise");
  }
  if (/crypto|bitcoin|usdt|binance/i.test(trimmed) && /profit|double|earn/i.test(trimmed)) {
    signals.push("crypto_profit_promise");
  }

  signals.push(...detectSuspiciousDomain(urls));

  if (
    signals.some((signal) =>
      ["otp_request", "pin_request", "password_request", "cvv_request", "whatsapp_code_request"].includes(signal),
    )
  ) {
    signals.push("account_takeover_risk");
  }

  if (/credited|debited|available balance|payment successful|transaction successful/i.test(trimmed)) {
    signals.push("safe_transaction_notice");
  }
  if (/parcel|delivery|courier/i.test(trimmed) && !/pay|fee|link|held/i.test(lowered)) {
    signals.push("safe_delivery_notice");
  }
  if (
    !signals.some((signal) =>
      [
        "otp_request",
        "pin_request",
        "password_request",
        "cvv_request",
        "payment_request",
        "unknown_url",
        "shortened_url",
        "apk_install_request",
        "qr_payment_request",
      ].includes(signal),
    )
  ) {
    signals.push("no_sensitive_request");
  }
  if (
    trimmed &&
    urls.length === 0 &&
    !signals.includes("safe_transaction_notice") &&
    !signals.includes("safe_delivery_notice") &&
    !/from |official|receipt|bill|statement/i.test(trimmed)
  ) {
    signals.push("unknown_sender");
  }

  const uniqueSignals = unique(signals);
  const baseRisk = computeBaseRisk(uniqueSignals);

  return {
    urls,
    signals: uniqueSignals,
    base_risk: baseRisk,
    evidence: buildEvidence(uniqueSignals, urls),
    scam_type_hint: getScamTypeHint(uniqueSignals, baseRisk),
  };
}
