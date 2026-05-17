import type { RiskLevel, TrustShieldModelInput, TrustShieldModelOutput } from "./modelTypes";

const riskLevels = ["safe", "suspicious", "dangerous"] as const;
const safeReplacement =
  "Do not continue through this message. Verify only through the official app, official website, or trusted family member.";
const defaultChecks = [
  "Check the sender or source.",
  "Open the official app or official website manually.",
  "Ask a trusted family member before acting.",
];

function clampConfidence(confidence: unknown): number {
  const value = typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(value)) return 0.5;
  if (value > 1 && value <= 100) return Math.min(1, Math.max(0, value / 100));
  return Math.min(1, Math.max(0, value));
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function hasUnsafeAdvice(value: string): boolean {
  return /click the link|open the link|share otp|share password|install apk|send money|pay first|reply with code/i.test(
    value,
  );
}

function safeText(value: string): string {
  return hasUnsafeAdvice(value) ? safeReplacement : value;
}

function safeArray(items: string[]): string[] {
  return items.map(safeText);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readRisk(value: unknown, fallback: RiskLevel): RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? (value as RiskLevel) : fallback;
}

function buildRiskyClues(input: TrustShieldModelInput, evidence: string[]): string[] {
  return unique([...evidence, ...input.detected_signals.map((signal) => `Detected signal: ${signal}`)]);
}

function buildSafeClues(input: TrustShieldModelInput): string[] {
  const clues: string[] = [];

  if (input.detected_signals.includes("no_sensitive_request")) {
    clues.push("No OTP, password, payment, or risky link request was detected.");
  }
  if (input.detected_urls.length === 0) {
    clues.push("No URL was detected in the extracted text.");
  }
  if (input.base_risk === "safe") {
    clues.push("The rule-based check did not find a major scam signal.");
  }

  return clues;
}

function getTopPlaybook(input: TrustShieldModelInput) {
  return input.retrieved_playbook?.[0] ?? null;
}

function getPlaybookEvidence(input: TrustShieldModelInput): string[] {
  const entries = input.retrieved_playbook ?? [];
  return entries.flatMap((entry) => [
    `Matched local playbook: ${entry.title}`,
    entry.explanation,
    entry.safe_action,
    ...(entry.user_checklist ?? []),
  ]);
}

function hasRiskySignals(input: TrustShieldModelInput): boolean {
  const riskySignals = [
    "otp_request",
    "pin_request",
    "password_request",
    "cvv_request",
    "whatsapp_code_request",
    "apk_install_request",
    "payment_request",
    "unknown_url",
    "shortened_url",
    "click_link_request",
    "claim_prize_request",
    "time_limited_offer",
    "qr_payment_request",
    "qr_contains_payment_link",
    "registration_fee",
    "delivery_fee_request",
  ];

  return input.detected_signals.some((signal) => riskySignals.includes(signal));
}

function hasSignal(input: TrustShieldModelInput, signal: string): boolean {
  return input.detected_signals.includes(signal);
}

function calibrateConfidence(input: TrustShieldModelInput, risk: RiskLevel, rawConfidence: number): number {
  if (rawConfidence > 0.05 && rawConfidence < 0.99) return rawConfidence;

  let confidence = risk === "dangerous" ? 0.78 : risk === "suspicious" ? 0.64 : 0.72;
  const topPlaybook = getTopPlaybook(input);

  if (topPlaybook?.risk_level === risk) confidence += 0.07;
  if (input.rule_risk_hint === risk) confidence += 0.06;
  if (input.evidence.length >= 3) confidence += 0.04;

  if (risk === "dangerous") {
    if (hasSignal(input, "otp_request") || hasSignal(input, "password_request")) confidence += 0.08;
    if (hasSignal(input, "fake_gift_card_offer") && hasSignal(input, "high_value_reward")) confidence += 0.08;
    if (hasSignal(input, "payment_request") || hasSignal(input, "qr_contains_payment_link")) confidence += 0.06;
  }

  if (risk === "suspicious") {
    if (hasSignal(input, "unknown_url") || hasSignal(input, "shortened_url")) confidence += 0.08;
    if (hasSignal(input, "urgent_action") || hasSignal(input, "external_action_request")) confidence += 0.05;
    if (hasSignal(input, "unknown_sender")) confidence += 0.04;
  }

  if (risk === "safe") {
    if (hasSignal(input, "safe_transaction_notice") || hasSignal(input, "safe_delivery_notice")) confidence += 0.11;
    if (hasSignal(input, "no_sensitive_request")) confidence += 0.05;
    if (hasRiskySignals(input)) confidence -= 0.12;
  }

  return Math.min(0.95, Math.max(0.55, confidence));
}

function getConservativeRisk(
  parsedRisk: RiskLevel,
  confidence: number,
  input: TrustShieldModelInput,
): { risk: RiskLevel; forcedFallback: boolean } {
  const topPlaybook = getTopPlaybook(input);
  const strongDanger =
    input.rule_risk_hint === "dangerous" &&
    topPlaybook?.risk_level === "dangerous" &&
    parsedRisk !== "dangerous" &&
    confidence < 0.7;

  if (strongDanger) return { risk: "dangerous", forcedFallback: true };

  const safeNotice =
    input.detected_signals.includes("safe_transaction_notice") &&
    !hasRiskySignals(input) &&
    parsedRisk === "dangerous";

  if (safeNotice) return { risk: input.rule_risk_hint === "suspicious" ? "suspicious" : "safe", forcedFallback: true };

  return { risk: parsedRisk, forcedFallback: false };
}

export function buildLocalFallbackOutput(input: TrustShieldModelInput): TrustShieldModelOutput {
  const evidence =
    input.evidence.length > 0 ? [...input.evidence] : ["No detailed model evidence was returned."];
  const scamType = input.scam_type_hint ?? "no_major_scam_signal";

  if (input.base_risk === "dangerous") {
    const safestAction = "Do not click links, share OTP, install apps, or send money.";

    return {
      risk_level: "dangerous",
      confidence: 0.9,
      scam_type: scamType,
      explanation:
        "This message contains high-risk scam signals that may be trying to make the user act quickly, reveal private information, install something, or send money.",
      scam_identity: {
        risky_clues: buildRiskyClues(input, evidence),
        safe_clues: [],
      },
      evidence,
      how_to_handle: {
        what_to_check: defaultChecks,
        why_to_check: [
          "Scammers often impersonate trusted services and create urgency.",
          "Official apps and websites are safer than links from messages.",
          "A second person can help spot pressure or impersonation.",
        ],
        safest_action: safestAction,
      },
      simple_warning: "Do not continue. This message contains high-risk scam signals.",
      safe_action: `${safestAction} Ask family first.`,
      family_alert: "TrustShield AI detected a dangerous message. Please check before any action.",
      model_source: "local_fallback",
      fallback_used: true,
      json_valid: false,
    };
  }

  if (input.base_risk === "suspicious") {
    const safestAction = "Do not act from this message until you verify it through an official source.";

    return {
      risk_level: "suspicious",
      confidence: 0.7,
      scam_type: scamType,
      explanation:
        "This message has suspicious signs, but the app cannot fully confirm the sender or intent from the extracted text alone.",
      scam_identity: {
        risky_clues: buildRiskyClues(input, evidence),
        safe_clues: buildSafeClues(input),
      },
      evidence,
      how_to_handle: {
        what_to_check: defaultChecks,
        why_to_check: [
          "The sender or offer may be fake even if the message looks normal.",
          "Manual verification avoids risky links and copied contact details.",
          "Family review is useful when a message creates pressure or offers a reward.",
        ],
        safest_action: safestAction,
      },
      simple_warning: "Be careful. This message may be unsafe.",
      safe_action: "Verify through the official app or a trusted family member before acting.",
      family_alert: "TrustShield AI detected a suspicious message. Please verify it first.",
      model_source: "local_fallback",
      fallback_used: true,
      json_valid: false,
    };
  }

  return {
    risk_level: "safe",
    confidence: 0.8,
    scam_type: scamType,
    explanation:
      "No major scam signal was found in the extracted text, but unexpected messages should still be handled carefully.",
    scam_identity: {
      risky_clues: evidence.filter((item) => !/no otp|no major/i.test(item)),
      safe_clues: buildSafeClues(input),
    },
    evidence,
    how_to_handle: {
      what_to_check: [
        "Check whether you expected this message.",
        "Check the sender using a known contact or official app if money or accounts are involved.",
        "Never share OTPs, passwords, PINs, or card details.",
      ],
      why_to_check: [
        "Safe-looking messages can still be spoofed.",
        "Official channels reduce the chance of following a fake instruction.",
      ],
      safest_action:
        "No action is needed unless you do not recognize the message. Never share OTPs or passwords.",
    },
    simple_warning: "No major scam signal found.",
    safe_action: "No action needed unless you do not recognize this message. Never share OTP or passwords.",
    family_alert: "",
    model_source: "local_fallback",
    fallback_used: true,
    json_valid: false,
  };
}

export function buildLocalSafetyFallback(
  input: TrustShieldModelInput,
  evidenceNote?: string,
): TrustShieldModelOutput {
  const fallback = buildLocalFallbackOutput(input);
  const evidence = [...fallback.evidence];
  if (evidenceNote) evidence.unshift(evidenceNote);

  return {
    ...fallback,
    evidence,
    scam_identity: {
      ...fallback.scam_identity,
      risky_clues: buildRiskyClues(input, evidence),
    },
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
    const markdownJson = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    const jsonBlock = markdownJson ? extractJsonBlock(markdownJson) : extractJsonBlock(rawText);
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
  const fallback = buildLocalFallbackOutput(fallbackInput);
  if (!parsed || typeof parsed !== "object") {
    return { ...fallback, raw_model_output: rawText, fallback_used: true, json_valid: false };
  }

  const value = parsed as Record<string, unknown>;
  const riskLevel = readRisk(value.risk_level ?? value.r, fallbackInput.base_risk);
  const modelEvidence = unique([...asStringArray(value.evidence), ...asStringArray(value.ev)]);
  const evidence = unique([
    ...modelEvidence,
    ...(modelEvidence.length > 0 ? [] : fallbackInput.evidence),
    ...(modelEvidence.length > 0 ? [] : getPlaybookEvidence(fallbackInput).slice(0, 3)),
  ]);
  const scamIdentity = readRecord(value.scam_identity);
  const howToHandle = readRecord(value.how_to_handle);
  const finalEvidence = evidence.length > 0 ? evidence : fallback.evidence;
  const rawConfidence = clampConfidence(value.confidence ?? value.c);
  const confidence = calibrateConfidence(fallbackInput, riskLevel, rawConfidence);
  const conservative = getConservativeRisk(riskLevel, confidence, fallbackInput);

  if (conservative.forcedFallback && conservative.risk === "dangerous") {
    return {
      ...buildLocalFallbackOutput({ ...fallbackInput, base_risk: "dangerous", rule_risk_hint: "dangerous" }),
      raw_model_output: rawText,
      model_source: "base_gemma",
      fallback_used: true,
      json_valid: true,
    };
  }

  if (conservative.forcedFallback) {
    const saferFallback = buildLocalFallbackOutput({
      ...fallbackInput,
      base_risk: conservative.risk,
      rule_risk_hint: conservative.risk,
    });

    return {
      ...saferFallback,
      raw_model_output: rawText,
      model_source: "base_gemma",
      fallback_used: true,
      json_valid: true,
    };
  }

  return {
    risk_level: conservative.risk,
    confidence,
    scam_type: readString(value.scam_type) || readString(value.t) || fallback.scam_type,
    explanation: safeText(readString(value.explanation) || readString(value.x) || fallback.explanation),
    scam_identity: {
      risky_clues: safeArray(unique([
        ...asStringArray(scamIdentity?.risky_clues),
        ...(asStringArray(scamIdentity?.risky_clues).length > 0
          ? []
          : [...fallback.scam_identity.risky_clues, ...getPlaybookEvidence(fallbackInput).slice(0, 2)]),
      ])),
      safe_clues: safeArray(unique([
        ...asStringArray(scamIdentity?.safe_clues),
        ...(asStringArray(scamIdentity?.safe_clues).length > 0 ? [] : fallback.scam_identity.safe_clues),
      ])),
    },
    evidence: safeArray(finalEvidence),
    how_to_handle: {
      what_to_check:
        asStringArray(howToHandle?.what_to_check).length > 0
          ? safeArray(asStringArray(howToHandle?.what_to_check))
          : fallback.how_to_handle.what_to_check,
      why_to_check:
        asStringArray(howToHandle?.why_to_check).length > 0
          ? safeArray(asStringArray(howToHandle?.why_to_check))
          : fallback.how_to_handle.why_to_check,
      safest_action: safeText(
        readString(howToHandle?.safest_action) || readString(value.a) || fallback.how_to_handle.safest_action,
      ),
    },
    simple_warning: safeText(readString(value.simple_warning) || fallback.simple_warning),
    safe_action: safeText(readString(value.safe_action) || readString(value.a) || fallback.safe_action),
    family_alert: safeText(typeof value.family_alert === "string" ? value.family_alert : fallback.family_alert),
    model_source: "base_gemma",
    fallback_used: false,
    json_valid: true,
    raw_model_output: rawText,
  };
}
