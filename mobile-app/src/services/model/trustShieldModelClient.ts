import { generate, isReady } from "../../native/TrustShieldGemma";
import { analyzeMockMessage } from "../mockAnalysisService";
import { buildBaseGemmaPrompt } from "./baseGemmaPrompt";
import { getTrustShieldModelMode, TRUSTSHIELD_MODEL_CONFIG } from "./modelConfig";
import { buildLocalSafetyFallback, parseTrustShieldModelOutput } from "./jsonModelParser";
import type { TrustShieldModelInput, TrustShieldModelOutput } from "./modelTypes";

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
    model_source: "mock",
  };
}

export async function analyzeWithTrustShieldModel(
  input: TrustShieldModelInput,
): Promise<TrustShieldModelOutput> {
  const limitedInput = {
    ...input,
    ocr_text: input.ocr_text.slice(0, TRUSTSHIELD_MODEL_CONFIG.maxInputChars),
  };

  if (getTrustShieldModelMode() === "mock") {
    return analyzeWithMock(limitedInput);
  }

  try {
    const ready = await isReady();
    if (!ready) {
      return buildLocalSafetyFallback(
        limitedInput,
        "Base Gemma 4 E2B is not loaded. Using local safety fallback.",
      );
    }

    const prompt = buildBaseGemmaPrompt(limitedInput);
    const raw = await generate(prompt, {
      maxTokens: TRUSTSHIELD_MODEL_CONFIG.maxOutputTokens,
      temperature: TRUSTSHIELD_MODEL_CONFIG.temperature,
    });
    const parsed = parseTrustShieldModelOutput(raw.text, limitedInput);

    return {
      ...parsed,
      latency_ms: raw.latency_ms,
      model_source: parsed.model_source === "local_fallback" ? "local_fallback" : "base_gemma",
      raw_model_output: raw.text,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemma generation error.";
    return buildLocalSafetyFallback(
      limitedInput,
      `Could not complete local model analysis: ${message}. Using local safety fallback.`,
    );
  }
}
