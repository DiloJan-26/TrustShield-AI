const scamTypeLabels: Record<string, string> = {
  reward_or_survey_scam: "Suspicious reward offer",
  fake_gift_card_prize_scam: "Fake prize / gift card scam",
  fake_gift_card_or_reward_scam: "Fake prize / gift card scam",
  bank_otp_phishing: "Bank OTP scam",
  account_takeover_or_otp_scam: "Bank or account code scam",
  bank_account_blocked_phishing: "Fake bank account warning",
  fake_kyc_update_scam: "Fake KYC update request",
  fake_delivery_fee_scam: "Fake delivery fee request",
  customs_parcel_fee_scam: "Fake customs parcel fee",
  delivery_fee_scam: "Fake delivery fee request",
  job_registration_fee_scam: "Job registration fee scam",
  part_time_task_job_scam: "Part-time task job scam",
  job_or_registration_fee_scam: "Job registration fee scam",
  loan_approval_fee_scam: "Loan approval fee scam",
  qr_payment_or_hidden_link_scam: "Suspicious QR/payment link",
  investment_profit_scam: "Investment profit scam",
  crypto_profit_scam: "Crypto profit scam",
  apk_install_malware: "Unsafe app installation request",
  whatsapp_account_takeover: "WhatsApp code theft attempt",
  fake_government_benefit_or_fee: "Fake government benefit/fee request",
  government_benefit_scam: "Fake government benefit/fee request",
  tax_or_fine_payment_scam: "Fake tax or fine payment",
  fake_telco_offer: "Suspicious mobile-data offer",
  telco_reward_or_data_offer: "Mobile-data offer",
  sim_upgrade_verification_scam: "SIM verification scam",
  safe_telco_offer_notice: "Safe mobile offer notice",
  fake_refund_or_cashback_scam: "Fake refund/cashback scam",
  marketplace_advance_payment_scam: "Marketplace advance payment scam",
  phishing_login_page_link: "Phishing login page",
  safe_transaction_notice: "Safe transaction notice",
  safe_delivery_notice: "Safe delivery notice",
  suspicious_short_link: "Suspicious short link",
  suspicious_unknown_offer: "Suspicious unknown offer",
  possible_phishing_or_payment_scam: "Possible phishing or payment scam",
  no_clear_scam_pattern_detected: "No clear scam pattern found",
};

const signalLabels: Record<string, string> = {
  otp_request: "Asks for OTP",
  click_link_request: "Asks user to click a link",
  claim_prize_request: "Asks user to claim a prize",
  time_limited_offer: "Uses time pressure",
  high_value_reward: "Promises a high-value reward",
  brand_impersonation: "Uses a known brand name",
  unknown_url: "Contains unknown link",
  shortened_url: "Uses shortened link",
  payment_request: "Requests payment",
  registration_fee: "Asks for registration fee",
  kyc_update_request: "Asks for KYC/details update",
  sim_upgrade_request: "Mentions SIM verification",
  customs_fee_request: "Asks for customs/clearance fee",
  loan_approval_fee: "Asks for loan approval fee",
  tax_fine_payment_request: "Threatens tax/fine payment",
  marketplace_advance_payment: "Marketplace advance payment request",
  phishing_login_page: "Login/verification link",
  no_sensitive_request: "No OTP/payment/password request found",
  safe_transaction_notice: "Looks like a normal transaction notice",
};

function snakeToTitle(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function getFriendlyScamType(type: string): string {
  return scamTypeLabels[type] ?? snakeToTitle(type);
}

export function getFriendlySignalLabel(signal: string): string {
  return signalLabels[signal] ?? snakeToTitle(signal);
}

export function formatRiskLabel(risk: string): string {
  return snakeToTitle(risk);
}
