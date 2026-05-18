import type { UrlSource } from "./urlIntelligence";

export type SafeLinkPreviewKind = "qr" | "url";

export type SafeLinkPreviewStatus =
  | "idle"
  | "checking"
  | "completed"
  | "no_internet"
  | "blocked"
  | "failed";

export type SafeLinkPreviewResult = {
  kind: SafeLinkPreviewKind;
  source: UrlSource;
  original_url: string;
  final_url?: string;
  domain?: string;
  status: SafeLinkPreviewStatus;
  http_status?: number;
  content_type?: string;
  page_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  redirect_count?: number;
  preview_text?: string;
  blocked_reason?: string;
  error_message?: string;
  checked_at?: string;
};

const BLOCKED_SCHEMES = [
  "file:",
  "data:",
  "javascript:",
  "intent:",
  "market:",
  "tel:",
  "sms:",
  "mailto:",
  "content:",
  "android-app:",
];
const MAX_REDIRECTS = 2;
const TIMEOUT_MS = 5000;
const MAX_HTML_CHARS = 100 * 1024;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80") ||
    isPrivateIpv4(host)
  );
}

function buildBlocked(
  input: { url: string; kind: SafeLinkPreviewKind; source: UrlSource },
  reason: string,
): SafeLinkPreviewResult {
  return {
    kind: input.kind,
    source: input.source,
    original_url: input.url,
    status: "blocked",
    blocked_reason: reason,
    checked_at: new Date().toISOString(),
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readMeta(html: string, key: string, attrName: "name" | "property"): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]+${attrName}=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+${attrName}=["']${key}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern);
  return match ? decodeHtml(match[1] || match[2] || "") : undefined;
}

function extractTitle(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeHtml(title.replace(/<[^>]*>/g, "")) : undefined;
}

function stripHtmlPreview(html: string): string | undefined {
  const text = decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
  return text ? text.slice(0, 220) : undefined;
}

function isHtmlContent(contentType: string): boolean {
  return /text\/html|application\/xhtml\+xml/i.test(contentType);
}

function isLikelyNoInternet(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /internet is off|offline|not connected|no internet|connection unavailable/i.test(message);
}

function getSafeFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/aborted|abort|timeout/i.test(message)) {
    return "This website did not respond quickly enough. You can still analyze locally.";
  }

  return "Could not check this website preview. You can still analyze locally.";
}

async function fetchWithTimeout(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "TrustShieldAI-SafePreview/1.0",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.5,*/*;q=0.1",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function getSafeHostname(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function getRedirectLocation(response: Response, currentUrl: string): string | null {
  if (response.status < 300 || response.status >= 400) return null;

  const location = response.headers.get("location");
  if (!location) return null;

  try {
    return new URL(location, currentUrl).toString();
  } catch {
    return null;
  }
}

function validatePreviewTarget(
  input: { url: string; kind: SafeLinkPreviewKind; source: UrlSource },
  targetUrl: string,
): SafeLinkPreviewResult | null {
  try {
    const parsed = new URL(targetUrl);
    const hostname = getSafeHostname(targetUrl);

    if (BLOCKED_SCHEMES.includes(parsed.protocol)) {
      return buildBlocked(input, `Blocked URL scheme: ${parsed.protocol}`);
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return buildBlocked(input, "Only http and https links can be previewed.");
    }
    if (isBlockedHost(hostname)) {
      return buildBlocked(input, "Private, localhost, or internal network links are not previewed.");
    }
  } catch {
    return buildBlocked(input, "Could not read this link safely.");
  }

  return null;
}

export async function checkSafeLinkPreview(input: {
  url: string;
  kind: SafeLinkPreviewKind;
  source: UrlSource;
}): Promise<SafeLinkPreviewResult> {
  const normalizedUrl = normalizeUrl(input.url);

  try {
    const parsed = new URL(normalizedUrl);
    const initialBlocked = validatePreviewTarget(input, parsed.toString());

    if (initialBlocked) return initialBlocked;

    let currentUrl = parsed.toString();
    let redirectCount = 0;
    let response: Response | null = null;

    for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt += 1) {
      try {
        response = await fetchWithTimeout(currentUrl, "HEAD");
      } catch {
        response = await fetchWithTimeout(currentUrl, "GET");
      }

      const redirectLocation = getRedirectLocation(response, currentUrl);
      if (!redirectLocation) break;
      if (redirectCount >= MAX_REDIRECTS) {
        return buildBlocked(input, "Safety Preview stopped after two redirects.");
      }

      const redirectBlocked = validatePreviewTarget(input, redirectLocation);
      if (redirectBlocked) return redirectBlocked;

      currentUrl = redirectLocation;
      redirectCount += 1;
    }

    if (!response) {
      throw new Error("No preview response.");
    }

    const finalUrl = response.url && response.url !== normalizedUrl ? response.url : currentUrl;
    const contentType = response.headers.get("content-type") ?? "";
    const baseResult: SafeLinkPreviewResult = {
      kind: input.kind,
      source: input.source,
      original_url: input.url,
      final_url: finalUrl,
      domain: getDomain(finalUrl),
      status: "completed",
      http_status: response.status,
      content_type: contentType || undefined,
      redirect_count: response.url && response.url !== currentUrl ? Math.max(redirectCount, 1) : redirectCount,
      checked_at: new Date().toISOString(),
    };

    if (!isHtmlContent(contentType)) {
      return baseResult;
    }

    const htmlResponse = response.bodyUsed ? response : await fetchWithTimeout(finalUrl, "GET");
    const html = (await htmlResponse.text()).slice(0, MAX_HTML_CHARS);

    return {
      ...baseResult,
      final_url: htmlResponse.url || finalUrl,
      domain: getDomain(htmlResponse.url || finalUrl),
      http_status: htmlResponse.status,
      content_type: htmlResponse.headers.get("content-type") ?? contentType,
      page_title: extractTitle(html),
      meta_description: readMeta(html, "description", "name"),
      og_title: readMeta(html, "og:title", "property"),
      og_description: readMeta(html, "og:description", "property"),
      preview_text: stripHtmlPreview(html),
    };
  } catch (error) {
    if (isLikelyNoInternet(error)) {
      return {
        kind: input.kind,
        source: input.source,
        original_url: input.url,
        status: "no_internet",
        error_message:
          "Internet is off. Safety Preview needs internet, but you can still analyze locally.",
        checked_at: new Date().toISOString(),
      };
    }

    return {
      kind: input.kind,
      source: input.source,
      original_url: input.url,
      status: "failed",
      error_message: getSafeFailureMessage(error),
      checked_at: new Date().toISOString(),
    };
  }
}
