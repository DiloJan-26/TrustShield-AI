import { analyzeMockMessage } from "../mockAnalysisService";
import { TRUSTSHIELD_MODEL_CONFIG } from "./modelConfig";
import type { TrustShieldModelInput, TrustShieldModelOutput } from "./modelTypes";

function notConnectedOutput(
  input: TrustShieldModelInput,
  message: string,
): TrustShieldModelOutput {
  return {
    risk_level: input.base_risk,
    confidence: input.base_risk === "dangerous" ? 0.9 : input.base_risk === "suspicious" ? 0.72 : 0.82,
    scam_type: input.scam_type_hint ?? "model_not_connected",
    evidence: input.evidence.length > 0 ? input.evidence : [message],
    simple_warning: message,
    safe_action: "Use Mock Safety Mode until the on-device Gemma module is connected.",
    family_alert: "TrustShield AI model mode is not connected yet. Please verify this message manually.",
  };
}

function analyzeWithMock(input: TrustShieldModelInput): TrustShieldModelOutput {
  const mockResult = analyzeMockMessage(input.ocr_text, {
    urls: input.detected_urls,
    signals: input.detected_signals,
    base_risk: input.base_risk,
    evidence: input.evidence,
    scam_type_hint: input.scam_type_hint ?? "no_clear_scam_pattern_detected",
  });

  return {
    risk_level: mockResult.risk_level,
    confidence: mockResult.confidence,
    scam_type: mockResult.scam_type,
    evidence: mockResult.evidence,
    simple_warning: mockResult.simple_warning,
    safe_action: mockResult.safe_action,
    family_alert: mockResult.family_alert,
  };
}

export async function analyzeWithTrustShieldModel(
  input: TrustShieldModelInput,
): Promise<TrustShieldModelOutput> {
  const limitedInput = {
    ...input,
    ocr_text: input.ocr_text.slice(0, TRUSTSHIELD_MODEL_CONFIG.maxInputChars),
  };

  if (TRUSTSHIELD_MODEL_CONFIG.mode === "mock") {
    return analyzeWithMock(limitedInput);
  }

  if (TRUSTSHIELD_MODEL_CONFIG.mode === "base_gemma") {
    return notConnectedOutput(
      limitedInput,
      "Base Gemma 4 E2B native module is not connected yet.",
    );
  }

  return notConnectedOutput(
    limitedInput,
    "Fine-tuned Gemma 4 E2B native module is not connected yet.",
  );
}
