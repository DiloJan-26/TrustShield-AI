import type { QrSafePreviewResult } from "./qrSafePreview";
import type { SafeLinkPreviewResult } from "./safeLinkPreview";
import type { UrlContext } from "./urlIntelligence";

export type BaseRisk = "safe" | "suspicious" | "dangerous";

export type ScamSignalResult = {
  urls: string[];
  signals: string[];
  base_risk: BaseRisk;
  evidence: string[];
  scam_type_hint: string;
};

export type QrSafePreviewSignalResult = {
  signals: string[];
  evidence: string[];
};

export type SafeLinkPreviewSignalResult = QrSafePreviewSignalResult;

const SHORTENER_PATTERN = /\b(?:bit\.ly|tinyurl\.com|shorturl\.at|t\.co|cutt\.ly)\b/i;
const SUSPICIOUS_TLD_PATTERN = /\.(?:store|info|online|top|click|xyz)\b/i;
const HIGH_VALUE_REWARD_PATTERN =
  /(?:free\s*)?(?:\$|rs\.?|lkr)\s?(?:1,000|1000|[5-9]\d{2,}|[1-9]\d{3,})|(?:high[- ]value|cash prize)/i;
const BRAND_PATTERN =
  /\b(?:amazon|daraz|dialog|mobitel|airtel|hutch|slt|sampath|commercial bank|boc|bank of ceylon|peoples bank|hnb|nsb|paypal|visa|mastercard|whatsapp|facebook|instagram)\b/i;
const TELCO_PATTERN =
  /\b(?:dialog|mobitel|airtel|hutch|slt|data package|reload|free data|bonus data|sim|connection|postpaid|prepaid)\b/i;
const TRUSTED_DOMAIN_PATTERN =
  /(?:^|\.)dialog\.lk$|(?:^|\.)mobitel\.lk$|(?:^|\.)airtel\.lk$|(?:^|\.)hutch\.lk$|(?:^|\.)slt\.lk$|(?:^|\.)amazon\.com$|(?:^|\.)gov\.lk$/i;

function normalize(text: string) {
  return text.toLowerCase();
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function hasAnySignal(signals: Set<string>, items: string[]): boolean {
  return items.some((item) => signals.has(item));
}

function hasUnknownOrShortLink(signals: Set<string>): boolean {
  return signals.has("unknown_url") || signals.has("shortened_url");
}

function getQrSection(text: string): string {
  const marker = "QR / barcode content:";
  const index = text.indexOf(marker);
  return index >= 0 ? text.slice(index + marker.length) : "";
}

function getHostname(url: string): string {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return url.toLowerCase().split("/")[0].replace(/^www\./, "");
  }
}

function isTrustedDomain(url: string): boolean {
  return TRUSTED_DOMAIN_PATTERN.test(getHostname(url));
}

export function extractUrls(text: string): string[] {
  const matches =
    text.match(
      /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+|\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|shorturl\.at)\/[^\s<>"')\]]+|\b[a-z0-9][a-z0-9.-]*\.(?:com|lk|net|org|store|info|online|top|click|xyz)\b[^\s<>"')\]]*/gi,
    ) ?? [];

  return matches.map((url) => url.replace(/[.,;:!?]+$/g, ""));
}

export function detectOtpRequest(text: string): boolean {
  return /\botp\b|one[- ]?time password|verification code|security code|login code/i.test(text);
}

export function detectCredentialRequest(text: string): string[] {
  const lowered = normalize(text);
  const signals: string[] = [];

  if (/\bpin\b|atm pin|card pin/i.test(lowered)) signals.push("pin_request");
  if (/password|passcode|login details|credentials|internet banking|mobile banking/i.test(lowered)) {
    signals.push("password_request");
  }
  if (/\bcvv\b|security number|card code/i.test(lowered)) signals.push("cvv_request");
  if (/whatsapp.*code|code.*whatsapp/i.test(lowered)) signals.push("whatsapp_code_request");

  return signals;
}

export function detectUrgency(text: string): boolean {
  return /urgent|now|immediately|blocked|suspend|suspended|locked|held|expire|expires soon|limited time|final notice|next \d+ minutes|within \d+ minutes/i.test(
    text,
  );
}

export function detectPaymentRequest(text: string): boolean {
  return /payment|pay|fee|send money|bank transfer|transfer now|deposit now|deposit first|processing fee|card details|lankaqr|wallet/i.test(
    text,
  );
}

export function detectRewardScam(text: string): boolean {
  return /give-away|giveaway|won|reward|congratulations|claim|prize|winner|free gift|selected to receive|you(?:'ve| have) been selected|gift card|cash prize/i.test(
    text,
  );
}

export function detectDeliveryScam(text: string): boolean {
  return /parcel|delivery|courier|shipping|held|customs|tracking|address confirmation/i.test(text);
}

export function detectJobScam(text: string): boolean {
  return /work from home|earn\s+(?:rs\.?|lkr|\$)?\s?\d+|daily income|part[- ]time job|registration fee|easy job|processing fee/i.test(
    text,
  );
}

export function detectBankImpersonation(text: string): boolean {
  if (/gift card/i.test(text) && !/bank|mobile banking|internet banking|account|debit|credit|kyc|atm/i.test(text)) {
    return false;
  }

  return (
    /bank|mobile banking|internet banking|atm|credit card|debit card|kyc/i.test(text) ||
    (/account/i.test(text) && /blocked|verify|otp|pin|password|suspend|suspended|locked/i.test(text))
  );
}

export function detectGovernmentImpersonation(text: string): boolean {
  return /government|gov\.lk|police|tax|revenue|customs|immigration|court|fine|benefit|allowance|relief/i.test(
    text,
  );
}

export function detectSuspiciousDomain(urls: string[]): string[] {
  const signals: string[] = [];
  const untrustedUrls = urls.filter((url) => !isTrustedDomain(url));

  if (untrustedUrls.length > 0) signals.push("unknown_url");
  if (untrustedUrls.some((url) => SHORTENER_PATTERN.test(url))) {
    signals.push("shortened_url");
    signals.push("link_shortener_detected");
  }
  if (untrustedUrls.some((url) => SUSPICIOUS_TLD_PATTERN.test(url))) signals.push("suspicious_tld");
  if (untrustedUrls.some((url) => /amaz[o0]n|d[i1]alog|mob[i1]tel|a[i1]rtel|bank|gov/i.test(url))) {
    signals.push("domain_impersonation");
  }

  return signals;
}

export function detectApkInstall(text: string): boolean {
  return /\.apk\b|install app|download app|install this application|enable unknown sources/i.test(text);
}

export function detectQrPayment(text: string): boolean {
  return /qr payment|scan qr|qr code|scan and pay|pay by qr/i.test(text);
}

function addRewardSignals(text: string, signals: string[]) {
  if (!detectRewardScam(text)) return;

  signals.push("reward_offer");
  if (/click (?:the )?link|click below|tap (?:the )?link|open (?:the )?link/i.test(text)) {
    signals.push("click_link_request");
  }
  if (/claim your prize|claim prize|claim now|claim (?:your )?(?:reward|gift|offer)/i.test(text)) {
    signals.push("claim_prize_request");
  }
  if (/next \d+ minutes|within \d+ minutes|expires soon|limited time|expire|hurry/i.test(text)) {
    signals.push("time_limited_offer");
    signals.push("urgent_expiry_claim");
  }
  if (HIGH_VALUE_REWARD_PATTERN.test(text)) signals.push("high_value_reward");
  if (/gift card|amazon gift card|free gift card/i.test(text)) signals.push("fake_gift_card_offer");
  if (/winner|won|selected to receive|you(?:'ve| have) been selected/i.test(text)) {
    signals.push("fake_lottery_or_winner_claim");
  }
  if (/cashback|refund/i.test(text)) signals.push("refund_or_cashback_claim");
  if (BRAND_PATTERN.test(text)) {
    signals.push("brand_impersonation");
    signals.push("official_brand_claim");
  }
  if (
    signals.includes("high_value_reward") ||
    signals.includes("fake_gift_card_offer") ||
    /free\s+(?:\$|rs\.?|lkr)?\s?\d+/i.test(text)
  ) {
    signals.push("too_good_to_be_true_offer");
  }
}

function addTelcoSignals(text: string, signals: string[]) {
  if (!TELCO_PATTERN.test(text)) return;

  signals.push("telco_offer_claim");
  signals.push("official_brand_claim");
  signals.push("official_app_available");
  signals.push("manual_verification_recommended");

  if (/data package|free data|bonus data|reload|sim|connection|postpaid|prepaid/i.test(text)) {
    signals.push("sim_or_data_package_offer");
  }
}

function addExternalActionSignals(text: string, signals: string[]) {
  if (
    /click|tap|open link|visit|claim|verify|confirm|submit|scan|download|install|reply|send|register|activate/i.test(
      text,
    )
  ) {
    signals.push("external_action_request");
  }
  if (/sensitive|otp|pin|password|cvv|card details|account details|login/i.test(text)) {
    signals.push("sensitive_action_request");
  }
}

function addQrSignals(text: string, urls: string[], signals: string[]) {
  const qrSection = getQrSection(text);
  if (!qrSection) return;

  signals.push("barcode_content_detected");

  const qrUrls = extractUrls(qrSection);
  if (qrUrls.length > 0 || urls.length > 0) signals.push("qr_contains_url");
  if (/pay|payment|amount=|merchant|lankaqr|fund transfer|bank|wallet|reload/i.test(qrSection)) {
    signals.push("qr_contains_payment_link");
  }
}

export function computeBaseRisk(signals: string[]): BaseRisk {
  const signalSet = new Set(signals);

  const directDangerSignals = [
    "otp_request",
    "pin_request",
    "password_request",
    "cvv_request",
    "whatsapp_code_request",
    "apk_install_request",
    "qr_payment_request",
    "qr_contains_payment_link",
  ];

  if (hasAnySignal(signalSet, directDangerSignals)) return "dangerous";
  if (signalSet.has("payment_request") && hasUnknownOrShortLink(signalSet)) return "dangerous";
  if (signalSet.has("delivery_fee_request")) return "dangerous";
  if (signalSet.has("registration_fee")) return "dangerous";
  if (signalSet.has("account_blocked_threat") && signalSet.has("bank_impersonation")) return "dangerous";
  if (
    signalSet.has("bank_impersonation") &&
    signalSet.has("urgent_action") &&
    signalSet.has("unknown_url")
  ) {
    return "dangerous";
  }
  if (
    signalSet.has("reward_offer") &&
    signalSet.has("click_link_request") &&
    signalSet.has("time_limited_offer")
  ) {
    return "dangerous";
  }
  if (
    signalSet.has("reward_offer") &&
    signalSet.has("claim_prize_request") &&
    signalSet.has("high_value_reward")
  ) {
    return "dangerous";
  }
  if (signalSet.has("fake_gift_card_offer") && signalSet.has("brand_impersonation")) return "dangerous";
  if (
    signalSet.has("claim_prize_request") &&
    signalSet.has("unknown_sender") &&
    signalSet.has("time_limited_offer")
  ) {
    return "dangerous";
  }
  if (
    signalSet.has("qr_contains_url") &&
    signalSet.has("reward_offer") &&
    signalSet.has("claim_prize_request")
  ) {
    return "dangerous";
  }
  if (signalSet.has("government_impersonation") && signalSet.has("payment_request")) {
    return "dangerous";
  }
  if (signalSet.has("job_offer_unrealistic") && signalSet.has("registration_fee")) {
    return "dangerous";
  }
  if (signalSet.has("investment_profit_promise") && signalSet.has("payment_request")) {
    return "dangerous";
  }
  if (
    signalSet.has("telco_offer_claim") &&
    signalSet.has("click_link_request") &&
    signalSet.has("unknown_url") &&
    signalSet.has("urgent_expiry_claim")
  ) {
    return "dangerous";
  }

  const suspiciousSignals = [
    "unknown_url",
    "shortened_url",
    "link_shortener_detected",
    "suspicious_tld",
    "domain_impersonation",
    "reward_offer",
    "survey_request",
    "unknown_sender",
    "external_action_request",
    "loan_offer",
    "investment_profit_promise",
    "crypto_profit_promise",
    "brand_impersonation",
    "telco_offer_claim",
    "address_confirmation_request",
    "qr_safe_preview_failed",
    "qr_preview_no_internet",
    "qr_preview_redirect_detected",
    "qr_preview_domain_mismatch",
    "qr_preview_login_or_payment_page",
    "qr_preview_reward_claim_page",
    "safe_link_preview_failed",
    "safe_link_preview_no_internet",
    "safe_link_preview_blocked",
    "safe_link_preview_redirect_detected",
    "safe_link_preview_domain_mismatch",
    "safe_link_preview_login_or_payment_page",
    "safe_link_preview_reward_claim_page",
  ];

  if (signalSet.has("telco_offer_claim") && !hasUnknownOrShortLink(signalSet)) {
    const riskyTelcoAction = hasAnySignal(signalSet, [
      "otp_request",
      "pin_request",
      "password_request",
      "cvv_request",
      "payment_request",
      "urgent_action",
      "click_link_request",
      "claim_prize_request",
    ]);
    return riskyTelcoAction ? "suspicious" : "safe";
  }

  if (signalSet.has("safe_transaction_notice") && !hasUnknownOrShortLink(signalSet)) return "safe";
  if (signalSet.has("safe_delivery_notice") && !hasUnknownOrShortLink(signalSet)) return "safe";
  if (suspiciousSignals.some((signal) => signalSet.has(signal))) return "suspicious";
  if (signalSet.has("no_sensitive_request")) return "safe";

  return "safe";
}

function buildEvidence(signals: string[], urls: string[]): string[] {
  const evidence: string[] = [];

  if (urls.length > 0) evidence.push(`Found link: ${urls.join(", ")}`);
  if (signals.includes("otp_request")) evidence.push("Message asks for an OTP or verification code.");
  if (signals.includes("pin_request")) evidence.push("Message asks for a PIN.");
  if (signals.includes("password_request")) evidence.push("Message asks for a password or login details.");
  if (signals.includes("cvv_request")) evidence.push("Message asks for card CVV details.");
  if (signals.includes("bank_impersonation")) evidence.push("Message mentions bank, card, KYC, or account details.");
  if (signals.includes("account_blocked_threat")) evidence.push("Message threatens account blocking or suspension.");
  if (signals.includes("urgent_action")) evidence.push("Message pushes urgent action.");
  if (signals.includes("urgent_expiry_claim")) evidence.push("Message creates time pressure.");
  if (signals.includes("unknown_url")) evidence.push("Message contains an unverified URL.");
  if (signals.includes("shortened_url")) evidence.push("Message uses a shortened URL.");
  if (signals.includes("link_shortener_detected")) evidence.push("Shortened link detected.");
  if (signals.includes("suspicious_tld")) evidence.push("Message uses a suspicious domain ending.");
  if (signals.includes("domain_impersonation")) evidence.push("Link or domain may imitate a trusted brand.");
  if (signals.includes("reward_offer")) evidence.push("Message offers a prize, reward, or giveaway.");
  if (signals.includes("fake_gift_card_offer")) evidence.push("Message claims to offer a gift card reward.");
  if (signals.includes("high_value_reward")) evidence.push("Message promises a high-value reward.");
  if (signals.includes("too_good_to_be_true_offer")) evidence.push("Offer appears too good to be true.");
  if (signals.includes("brand_impersonation")) evidence.push("Message uses a well-known brand name.");
  if (signals.includes("click_link_request")) evidence.push("Message asks the user to click a link.");
  if (signals.includes("claim_prize_request")) evidence.push("Message asks the user to claim a prize or reward.");
  if (signals.includes("time_limited_offer")) evidence.push("Message asks the user to act quickly.");
  if (signals.includes("fake_lottery_or_winner_claim")) evidence.push("Message claims the user won or was selected.");
  if (signals.includes("survey_request")) evidence.push("Message asks the user to complete a survey.");
  if (signals.includes("payment_request")) evidence.push("Message requests payment or money transfer.");
  if (signals.includes("registration_fee")) evidence.push("Message asks for a registration fee.");
  if (signals.includes("job_offer_unrealistic")) evidence.push("Message promises unrealistic job income.");
  if (signals.includes("delivery_fee_request")) evidence.push("Message asks for a parcel or delivery fee.");
  if (signals.includes("qr_payment_request")) evidence.push("Message asks for QR payment.");
  if (signals.includes("barcode_content_detected")) evidence.push("QR/barcode content detected.");
  if (signals.includes("qr_contains_url")) evidence.push("QR contains URL.");
  if (signals.includes("qr_contains_payment_link")) evidence.push("QR content appears to include a payment link or payment details.");
  if (signals.includes("apk_install_request")) evidence.push("Message asks the user to install an APK/app.");
  if (signals.includes("government_impersonation")) evidence.push("Message appears to impersonate a government service.");
  if (signals.includes("government_benefit_claim")) evidence.push("Message claims a government benefit or relief payment.");
  if (signals.includes("loan_offer")) evidence.push("Message offers a loan or fast approval.");
  if (signals.includes("investment_profit_promise")) evidence.push("Message promises investment profit.");
  if (signals.includes("crypto_profit_promise")) evidence.push("Message promises crypto profit.");
  if (signals.includes("whatsapp_code_request")) evidence.push("Message asks for a WhatsApp code.");
  if (signals.includes("telco_offer_claim")) evidence.push("Message claims to offer a free mobile/data reward.");
  if (signals.includes("official_app_available")) {
    evidence.push("User should verify inside the official app or official outlet instead of clicking a message link.");
  }
  if (signals.includes("manual_verification_recommended")) {
    evidence.push("Manual verification through an official source is recommended.");
  }
  if (signals.includes("sender_verification_needed")) evidence.push("Sender should be verified before acting.");
  if (signals.includes("safe_transaction_notice")) evidence.push("Safe-looking transaction notice with no action request.");
  if (signals.includes("safe_delivery_notice")) evidence.push("Looks like a delivery notice without a payment or link request.");
  if (signals.includes("no_sensitive_request")) evidence.push("No OTP, password, payment, or link request found.");
  if (signals.includes("qr_safe_preview_available")) evidence.push("QR Safe Preview metadata was available.");
  if (signals.includes("qr_safe_preview_failed")) evidence.push("QR Safe Preview could not check the website.");
  if (signals.includes("qr_preview_no_internet")) evidence.push("QR Safe Preview was skipped because internet was unavailable.");
  if (signals.includes("qr_preview_redirect_detected")) evidence.push("QR Safe Preview detected a redirect.");
  if (signals.includes("qr_preview_domain_mismatch")) evidence.push("QR Safe Preview final domain differs from the original QR domain.");
  if (signals.includes("qr_preview_login_or_payment_page")) evidence.push("QR preview text mentions login, account, OTP, KYC, wallet, or payment.");
  if (signals.includes("qr_preview_reward_claim_page")) evidence.push("QR preview text mentions a prize, reward, gift, or claim.");
  if (signals.includes("safe_link_preview_available")) evidence.push("Safety Preview metadata was available.");
  if (signals.includes("safe_link_preview_failed")) evidence.push("Safety Preview could not check the website.");
  if (signals.includes("safe_link_preview_no_internet")) evidence.push("Safety Preview was skipped because internet was unavailable.");
  if (signals.includes("safe_link_preview_blocked")) evidence.push("Safety Preview blocked the link for safety.");
  if (signals.includes("safe_link_preview_redirect_detected")) evidence.push("Safety Preview detected a redirect.");
  if (signals.includes("safe_link_preview_domain_mismatch")) evidence.push("Safety Preview final domain differs from the original domain.");
  if (signals.includes("safe_link_preview_login_or_payment_page")) evidence.push("Safety preview text mentions login, account, OTP, KYC, wallet, or payment.");
  if (signals.includes("safe_link_preview_reward_claim_page")) evidence.push("Safety preview text mentions a prize, reward, gift, or claim.");

  return unique(evidence);
}

function getPreviewText(preview: SafeLinkPreviewResult): string {
  return [
    preview.page_title,
    preview.meta_description,
    preview.og_title,
    preview.og_description,
    preview.preview_text,
  ]
    .filter(Boolean)
    .join(" ");
}

function getOriginalDomain(preview: SafeLinkPreviewResult, urlContexts: UrlContext[]): string | undefined {
  const context = urlContexts.find((item) => item.url === preview.original_url);
  if (context?.domain) return context.domain;

  try {
    const withScheme = /^https?:\/\//i.test(preview.original_url)
      ? preview.original_url
      : `https://${preview.original_url}`;
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function extractSafeLinkPreviewSignals(
  previews: SafeLinkPreviewResult[] = [],
  urlContexts: UrlContext[] = [],
): SafeLinkPreviewSignalResult {
  const signals: string[] = [];
  const evidence: string[] = [];

  previews.forEach((preview) => {
    if (preview.status === "completed") {
      signals.push("safe_link_preview_available");
      evidence.push("Safety Preview checked limited public website metadata.");
    }
    if (preview.status === "failed") signals.push("safe_link_preview_failed");
    if (preview.status === "no_internet") signals.push("safe_link_preview_no_internet");
    if (preview.status === "blocked") signals.push("safe_link_preview_blocked");

    const originalDomain = getOriginalDomain(preview, urlContexts);
    if (preview.final_url && preview.final_url !== preview.original_url) {
      signals.push("safe_link_preview_redirect_detected");
    }
    if (originalDomain && preview.domain && preview.domain !== originalDomain) {
      signals.push("safe_link_preview_domain_mismatch");
    }

    const previewText = getPreviewText(preview);
    if (/login|verify|payment|pay|wallet|otp|kyc|account blocked|account|blocked/i.test(previewText)) {
      signals.push("safe_link_preview_login_or_payment_page");
    }
    if (/claim|reward|prize|gift/i.test(previewText)) {
      signals.push("safe_link_preview_reward_claim_page");
    }
  });

  return {
    signals: unique(signals),
    evidence: unique(evidence),
  };
}

export function extractQrSafePreviewSignals(
  previews: QrSafePreviewResult[] = [],
  urlContexts: UrlContext[] = [],
): QrSafePreviewSignalResult {
  const safeSignals = extractSafeLinkPreviewSignals(previews, urlContexts);

  return {
    signals: safeSignals.signals.map((signal) =>
      signal
        .replace("safe_link_preview_available", "qr_safe_preview_available")
        .replace("safe_link_preview_failed", "qr_safe_preview_failed")
        .replace("safe_link_preview_no_internet", "qr_preview_no_internet")
        .replace("safe_link_preview_blocked", "qr_safe_preview_failed")
        .replace("safe_link_preview_redirect_detected", "qr_preview_redirect_detected")
        .replace("safe_link_preview_domain_mismatch", "qr_preview_domain_mismatch")
        .replace("safe_link_preview_login_or_payment_page", "qr_preview_login_or_payment_page")
        .replace("safe_link_preview_reward_claim_page", "qr_preview_reward_claim_page"),
    ),
    evidence: safeSignals.evidence,
  };
}

function getScamTypeHint(signals: string[], baseRisk: BaseRisk): string {
  if (signals.includes("otp_request") || signals.includes("whatsapp_code_request")) {
    return "account_takeover_or_otp_scam";
  }
  if (signals.includes("fake_gift_card_offer")) return "fake_gift_card_or_reward_scam";
  if (signals.includes("telco_offer_claim")) return "telco_reward_or_data_offer";
  if (signals.includes("bank_impersonation")) return "bank_impersonation";
  if (signals.includes("delivery_fee_request")) return "delivery_fee_scam";
  if (signals.includes("job_offer_unrealistic")) return "job_or_registration_fee_scam";
  if (signals.includes("reward_offer")) return "reward_or_survey_scam";
  if (signals.includes("government_benefit_claim")) return "government_benefit_scam";
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
  if (/blocked|suspend|suspended|locked|account.*hold|account.*verify|kyc.*verify/i.test(trimmed)) {
    signals.push("account_blocked_threat");
  }
  if (detectUrgency(trimmed)) signals.push("urgent_action");
  addRewardSignals(trimmed, signals);
  addTelcoSignals(trimmed, signals);
  addExternalActionSignals(trimmed, signals);
  if (/survey/i.test(trimmed)) signals.push("survey_request");
  if (detectPaymentRequest(trimmed)) signals.push("payment_request");
  if (/registration fee/i.test(trimmed)) signals.push("registration_fee");
  if (detectJobScam(trimmed)) signals.push("job_offer_unrealistic");
  if (detectDeliveryScam(trimmed) && /delivery fee|shipping fee|pay|payment|rs\s?350|lkr\s?350/i.test(trimmed)) {
    signals.push("delivery_fee_request");
  }
  if (detectDeliveryScam(trimmed) && /address confirmation|confirm address|update address/i.test(trimmed)) {
    signals.push("address_confirmation_request");
  }
  if (detectQrPayment(trimmed)) signals.push("qr_payment_request");
  if (detectApkInstall(trimmed)) signals.push("apk_install_request");
  if (detectGovernmentImpersonation(trimmed)) signals.push("government_impersonation");
  if (/benefit|allowance|relief|grant/i.test(trimmed) && /government|gov|samurdhi|tax|revenue/i.test(trimmed)) {
    signals.push("government_benefit_claim");
  }
  if (/loan|quick cash|instant approval|loan approved/i.test(trimmed)) signals.push("loan_offer");
  if (/investment|double your money|guaranteed profit|profit daily|investment return/i.test(trimmed)) {
    signals.push("investment_profit_promise");
  }
  if (/crypto|bitcoin|usdt|binance/i.test(trimmed) && /profit|double|earn/i.test(trimmed)) {
    signals.push("crypto_profit_promise");
  }

  addQrSignals(trimmed, urls, signals);
  signals.push(...detectSuspiciousDomain(urls));

  if (
    signals.some((signal) =>
      ["otp_request", "pin_request", "password_request", "cvv_request", "whatsapp_code_request"].includes(signal),
    )
  ) {
    signals.push("account_takeover_risk");
  }

  if (/credited|debited|available balance|payment successful|transaction successful|transaction/i.test(trimmed)) {
    if (!urls.length && !hasAnySignal(new Set(signals), ["otp_request", "pin_request", "password_request", "cvv_request", "external_action_request"])) {
      signals.push("safe_transaction_notice");
    }
  }
  if (/parcel|delivery|courier|tracking/i.test(trimmed) && !/pay|fee|link|held|confirm|update/i.test(lowered)) {
    signals.push("safe_delivery_notice");
  }
  if (
    trimmed &&
    urls.length === 0 &&
    !signals.includes("safe_transaction_notice") &&
    !signals.includes("safe_delivery_notice") &&
    !/from |official|receipt|bill|statement/i.test(trimmed)
  ) {
    signals.push("unknown_sender");
    signals.push("sender_verification_needed");
  }

  const sensitiveBlockers = [
    "click_link_request",
    "claim_prize_request",
    "external_action_request",
    "time_limited_offer",
    "urgent_action",
    "unknown_url",
    "shortened_url",
    "payment_request",
    "qr_payment_request",
    "apk_install_request",
    "otp_request",
    "password_request",
    "pin_request",
    "cvv_request",
    "registration_fee",
    "delivery_fee_request",
    "whatsapp_code_request",
  ];

  const hasRewardClickOrClaim =
    signals.includes("reward_offer") &&
    (signals.includes("click_link_request") || signals.includes("claim_prize_request"));
  const hasTelcoUnknownLink = signals.includes("telco_offer_claim") && urls.length > 0;
  if (
    !hasAnySignal(new Set(signals), sensitiveBlockers) &&
    !hasRewardClickOrClaim &&
    !hasTelcoUnknownLink
  ) {
    signals.push("no_sensitive_request");
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
