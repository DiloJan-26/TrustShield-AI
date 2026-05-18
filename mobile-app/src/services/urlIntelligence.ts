export type UrlSource = "visible_text" | "qr_barcode" | "manual";

export type UrlContext = {
  url: string;
  source: UrlSource;
  domain?: string;
  protocol?: string;
  is_https?: boolean;
  is_shortened?: boolean;
  suspicious_tld?: boolean;
  trusted_domain?: boolean;
  brand_impersonation_hint?: string | null;
  path_keywords?: string[];
};

const SHORTENER_DOMAINS = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "shorturl.at"];
const SUSPICIOUS_TLDS = ["store", "info", "online", "top", "click", "xyz"];
const TRUSTED_DOMAINS = [
  "dialog.lk",
  "airtel.lk",
  "mobitel.lk",
  "hutch.lk",
  "slt.lk",
  "cbsl.gov.lk",
  "cert.gov.lk",
  "police.lk",
  "trc.gov.lk",
  "amazon.com",
];
const BRAND_HINTS = [
  "dialog",
  "airtel",
  "mobitel",
  "hutch",
  "slt",
  "amazon",
  "bank",
  "boc",
  "peoplesbank",
  "commercialbank",
  "sampath",
  "hnb",
  "nsb",
];
const PATH_KEYWORDS = [
  "login",
  "verify",
  "claim",
  "reward",
  "prize",
  "gift",
  "payment",
  "pay",
  "wallet",
  "otp",
  "kyc",
  "update",
  "secure",
  "account",
  "block",
  "urgent",
  "reload",
  "free-data",
  "free_data",
  "offer",
];

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function hostnameMatches(domain: string, officialDomain: string): boolean {
  return domain === officialDomain || domain.endsWith(`.${officialDomain}`);
}

function getTld(domain: string): string {
  return domain.split(".").pop() ?? "";
}

function detectBrandHint(domain: string, trustedDomain: boolean): string | null {
  if (trustedDomain) return null;
  return BRAND_HINTS.find((brand) => domain.replace(/[-.]/g, "").includes(brand)) ?? null;
}

function detectPathKeywords(pathAndQuery: string): string[] {
  const normalized = pathAndQuery.toLowerCase().replace(/[_/=&?]+/g, "-");
  return PATH_KEYWORDS.filter((keyword) => normalized.includes(keyword));
}

export function analyzeUrlLocally(url: string, source: UrlSource): UrlContext {
  const normalizedUrl = normalizeUrl(url);

  try {
    const parsed = new URL(normalizedUrl);
    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const trustedDomain = TRUSTED_DOMAINS.some((officialDomain) =>
      hostnameMatches(domain, officialDomain),
    );

    return {
      url,
      source,
      domain,
      protocol: parsed.protocol.replace(":", ""),
      is_https: parsed.protocol === "https:",
      is_shortened: SHORTENER_DOMAINS.some((shortener) => hostnameMatches(domain, shortener)),
      suspicious_tld: SUSPICIOUS_TLDS.includes(getTld(domain)),
      trusted_domain: trustedDomain,
      brand_impersonation_hint: detectBrandHint(domain, trustedDomain),
      path_keywords: detectPathKeywords(`${parsed.pathname} ${parsed.search}`),
    };
  } catch {
    const fallbackDomain = normalizedUrl
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
      .split(/[/?#]/)[0]
      .toLowerCase()
      .replace(/^www\./, "");
    const trustedDomain = TRUSTED_DOMAINS.some((officialDomain) =>
      hostnameMatches(fallbackDomain, officialDomain),
    );

    return {
      url,
      source,
      domain: fallbackDomain || undefined,
      trusted_domain: trustedDomain,
      is_shortened: SHORTENER_DOMAINS.some((shortener) => hostnameMatches(fallbackDomain, shortener)),
      suspicious_tld: SUSPICIOUS_TLDS.includes(getTld(fallbackDomain)),
      brand_impersonation_hint: detectBrandHint(fallbackDomain, trustedDomain),
      path_keywords: [],
    };
  }
}

export function analyzeUrlsLocally(urls: string[], source: UrlSource): UrlContext[] {
  return unique(urls).map((url) => analyzeUrlLocally(url, source));
}

export function summarizeUrlContext(context: UrlContext): string {
  if (context.trusted_domain) return "Trusted domain";
  if (context.brand_impersonation_hint) return `Brand mismatch: ${context.brand_impersonation_hint}`;
  if (context.suspicious_tld) return "Suspicious TLD";
  if (context.is_shortened) return "Short link";
  if (context.domain) return "Unknown domain";
  return "Could not read domain";
}
