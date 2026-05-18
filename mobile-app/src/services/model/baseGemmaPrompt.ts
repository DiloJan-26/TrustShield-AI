import type { TrustShieldModelInput } from "./modelTypes";
import { TRUSTSHIELD_MODEL_CONFIG } from "./modelConfig";

export function buildBaseGemmaPrompt(input: TrustShieldModelInput): string {
  const playbook = input.retrieved_playbook?.slice(0, 3).map((entry) => ({
    id: entry.id,
    title: entry.title.slice(0, 48),
    risk: entry.risk_level,
    type: entry.scam_type,
  }));
  const urlContexts = input.url_contexts?.slice(0, 3).map((context) => ({
    u: context.url.slice(0, 80),
    src: context.source,
    d: context.domain,
    https: context.is_https,
    short: context.is_shortened,
    tld: context.suspicious_tld,
    trusted: context.trusted_domain,
    brand: context.brand_impersonation_hint,
    path: context.path_keywords?.slice(0, 3),
  }));
  const safeLinkPreviews = (input.safe_link_previews ?? input.qr_safe_preview)?.slice(0, 2).map((preview) => ({
    kind: preview.kind,
    url: preview.original_url.slice(0, 80),
    status: preview.status,
    final: preview.final_url?.slice(0, 80),
    domain: preview.domain,
    http: preview.http_status,
    type: preview.content_type?.slice(0, 40),
    title: (preview.og_title || preview.page_title)?.slice(0, 70),
    desc: (preview.og_description || preview.meta_description)?.slice(0, 90),
    redirects: preview.redirect_count,
    blocked: preview.blocked_reason?.slice(0, 60),
  }));
  const compactInput = {
    text: input.ocr_text.trim().slice(0, TRUSTSHIELD_MODEL_CONFIG.maxInputChars),
    urls: input.detected_urls.slice(0, 3),
    signals: input.detected_signals.slice(0, 8),
    risk: input.rule_risk_hint ?? input.base_risk,
    ev: input.evidence.slice(0, 4),
    hint: input.scam_type_hint,
    playbook,
    urlctx: urlContexts,
    previews: safeLinkPreviews,
  };

return `JSON only. Classify scam risk for elder safety.
Input may include OCR text, QR/barcode content, local URL analysis, and optional Safe Link Preview metadata.
Safe Link Preview is limited public metadata only; do not assume a page is safe just because it loads.
Use text, urls, signals, risk hint, playbook, urlctx, and previews. Final decision is yours.
Dangerous: OTP/PIN/password/CVV/code/APK/payment/QR pay/urgent bank verify or prize+claim/click+urgency/high value/brand.
Suspicious: unknown link or unclear offer. Safe: normal notice with no link/code/payment/urgency.
Never advise link clicks, sharing codes/passwords, APK installs, or money transfer.
Return one short JSON object only with keys r,c,t,x,a.
r is safe/suspicious/dangerous. c is confidence decimal 0.55 to 0.95, never 0, 1, or percent.
t is a short scam/category name.
x explains what the message is trying to make the user believe or do, in plain public language. Do not give advice in x.
a gives the safest next action, specific to this message. Max 22 words each for x and a.
Input:
${JSON.stringify(compactInput)}`;
}
