import type { TrustShieldModelInput, TrustShieldModelOutput } from "./modelTypes";

const riskLevels = ["safe", "suspicious", "dangerous"] as const;

function clampConfidence(confidence: unknown): number {
  const value = typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function fallbackOutput(input: TrustShieldModelInput): TrustShieldModelOutput {
  const warningByRisk: Record<TrustShieldModelOutput["risk_level"], string> = {
    dangerous: "Do not continue. This message contains high-risk scam signals.",
    suspicious: "Be careful. Verify this message through the official app or a trusted family member.",
    safe: "No major scam signal found. Still never share OTP, passwords, or bank details.",
  };

  return {
    risk_level: input.base_risk,
    confidence: input.base_risk === "dangerous" ? 0.9 : input.base_risk === "suspicious" ? 0.72 : 0.82,
    scam_type: input.scam_type_hint ?? "unknown",
    evidence: input.evidence.length > 0 ? input.evidence : ["No detailed model evidence was returned."],
    simple_warning: warningByRisk[input.base_risk],
    safe_action:
      input.base_risk === "safe"
        ? "Continue carefully and verify unexpected financial or account messages."
        : "Stop and verify through an official channel or trusted family member.",
    family_alert:
      input.base_risk === "safe"
        ? "TrustShield AI did not find a clear scam pattern, but please verify if the message feels unexpected."
        : "TrustShield AI found risky signals. Please help check this before the user takes action.",
  };
}

function parseJson(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
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
  if (!parsed || typeof parsed !== "object") return fallbackOutput(fallbackInput);

  const value = parsed as Record<string, unknown>;
  const fallback = fallbackOutput(fallbackInput);
  const riskLevel = riskLevels.includes(value.risk_level as TrustShieldModelOutput["risk_level"])
    ? (value.risk_level as TrustShieldModelOutput["risk_level"])
    : fallbackInput.base_risk;
  const evidence = Array.isArray(value.evidence)
    ? value.evidence.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallbackInput.evidence;

  if (
    typeof value.scam_type !== "string" ||
    typeof value.simple_warning !== "string" ||
    typeof value.safe_action !== "string" ||
    typeof value.family_alert !== "string"
  ) {
    return fallback;
  }

  return {
    risk_level: riskLevel,
    confidence: clampConfidence(value.confidence),
    scam_type: value.scam_type,
    evidence: evidence.length > 0 ? evidence : fallbackInput.evidence,
    simple_warning: value.simple_warning,
    safe_action: value.safe_action,
    family_alert: value.family_alert,
  };
}
