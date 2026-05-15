import type { TrustShieldModelInput, TrustShieldModelOutput } from "./modelTypes";

const riskLevels = ["safe", "suspicious", "dangerous"] as const;

function clampConfidence(confidence: unknown): number {
  const value = typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export function buildLocalSafetyFallback(
  input: TrustShieldModelInput,
  evidenceNote?: string,
): TrustShieldModelOutput {
  const evidence = input.evidence.length > 0 ? [...input.evidence] : ["No detailed model evidence was returned."];
  if (evidenceNote) evidence.unshift(evidenceNote);

  if (input.base_risk === "dangerous") {
    return {
      risk_level: "dangerous",
      confidence: 0.9,
      scam_type: input.scam_type_hint ?? "high_risk_scam_signals",
      evidence,
      simple_warning: "Do not continue. This message contains high-risk scam signals.",
      safe_action: "Do not click links, share OTP, install apps, or send money. Ask family first.",
      family_alert: "TrustShield AI detected a dangerous message. Please check before any action.",
      model_source: "local_fallback",
    };
  }

  if (input.base_risk === "suspicious") {
    return {
      risk_level: "suspicious",
      confidence: 0.7,
      scam_type: input.scam_type_hint ?? "suspicious_message",
      evidence,
      simple_warning: "Be careful. This message may be unsafe.",
      safe_action: "Verify through the official app or a trusted family member before acting.",
      family_alert: "TrustShield AI detected a suspicious message. Please verify it first.",
      model_source: "local_fallback",
    };
  }

  return {
    risk_level: "safe",
    confidence: 0.8,
    scam_type: input.scam_type_hint ?? "no_major_scam_signal",
    evidence,
    simple_warning: "No major scam signal found.",
    safe_action: "No action needed unless you do not recognize this message. Never share OTP or passwords.",
    family_alert: "",
    model_source: "local_fallback",
  };
}

function extractJsonBlock(rawText: string): string | null {
  const firstBrace = rawText.indexOf("{");
  if (firstBrace < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return rawText.slice(firstBrace, index + 1);
  }

  const lastBrace = rawText.lastIndexOf("}");
  return lastBrace > firstBrace ? rawText.slice(firstBrace, lastBrace + 1) : null;
}

function parseJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText.trim());
  } catch {
    const jsonBlock = extractJsonBlock(rawText);
    if (!jsonBlock) return null;

    try {
      return JSON.parse(jsonBlock);
    } catch {
      return null;
    }
  }
}

export function parseTrustShieldModelOutput(
  rawText: string,
  fallbackInput: TrustShieldModelInput,
): TrustShieldModelOutput {
  const parsed = parseJson(rawText);
  const fallback = buildLocalSafetyFallback(fallbackInput);
  if (!parsed || typeof parsed !== "object") {
    return { ...fallback, raw_model_output: rawText };
  }

  const value = parsed as Record<string, unknown>;
  const riskLevel = riskLevels.includes(value.risk_level as TrustShieldModelOutput["risk_level"])
    ? (value.risk_level as TrustShieldModelOutput["risk_level"])
    : fallbackInput.base_risk;
  const evidence = Array.isArray(value.evidence)
    ? value.evidence.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallbackInput.evidence;

  return {
    risk_level: riskLevel,
    confidence: clampConfidence(value.confidence),
    scam_type: typeof value.scam_type === "string" && value.scam_type.trim() ? value.scam_type : fallback.scam_type,
    evidence: evidence.length > 0 ? evidence : fallbackInput.evidence,
    simple_warning:
      typeof value.simple_warning === "string" && value.simple_warning.trim()
        ? value.simple_warning
        : fallback.simple_warning,
    safe_action:
      typeof value.safe_action === "string" && value.safe_action.trim()
        ? value.safe_action
        : fallback.safe_action,
    family_alert: typeof value.family_alert === "string" ? value.family_alert : fallback.family_alert,
    model_source: "base_gemma",
    raw_model_output: rawText,
  };
}
