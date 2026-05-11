export function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/\S+|www\.\S+|\b\S+\.(?:com|lk|store|net|org)\b/gi) ?? [];
}

export function detectOtpRequest(text: string): boolean {
  return /\botp\b|one[- ]?time password|verification code/i.test(text);
}

export function detectUrgency(text: string): boolean {
  return /urgent|now|immediately|blocked|held|expire|limited time/i.test(text);
}

export function detectPaymentRequest(text: string): boolean {
  return /payment|pay|fee|registration fee|delivery fee|send money|bank transfer|lkr|rs\./i.test(text);
}

export function detectRewardScam(text: string): boolean {
  return /give-away|giveaway|won|reward|congratulations|survey|claim|prize/i.test(text);
}

export function detectDeliveryScam(text: string): boolean {
  return /parcel|delivery|courier|held|shipping fee/i.test(text);
}

export function detectJobScam(text: string): boolean {
  return /work from home|earn|daily|registration fee|job/i.test(text);
}

export function detectSuspiciousDomain(text: string): boolean {
  return /\.store\b|gift|claim|reward|bit\.ly|tinyurl|shorturl/i.test(text);
}

export function extractScamSignals(text: string): string[] {
  const signals: string[] = [];
  const urls = extractUrls(text);

  if (urls.length > 0) signals.push(`Contains link: ${urls.join(", ")}`);
  if (detectOtpRequest(text)) signals.push("Requests OTP or verification code");
  if (detectUrgency(text)) signals.push("Uses urgent or threatening language");
  if (detectPaymentRequest(text)) signals.push("Requests payment or money transfer");
  if (detectRewardScam(text)) signals.push("Claims a prize, reward, or giveaway");
  if (detectDeliveryScam(text)) signals.push("Mentions parcel or delivery fee");
  if (detectJobScam(text)) signals.push("Mentions easy job income or registration fee");
  if (detectSuspiciousDomain(text)) signals.push("Uses a suspicious domain or short link");

  return signals;
}
