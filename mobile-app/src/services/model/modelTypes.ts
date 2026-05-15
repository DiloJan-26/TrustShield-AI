export type ModelMode = "mock" | "base_gemma";

export type ModelSource = "mock" | "base_gemma" | "local_fallback";

export type TrustShieldModelInput = {
  ocr_text: string;
  detected_urls: string[];
  detected_signals: string[];
  base_risk: "safe" | "suspicious" | "dangerous";
  evidence: string[];
  scam_type_hint?: string;
};

export type TrustShieldModelOutput = {
  risk_level: "safe" | "suspicious" | "dangerous";
  confidence: number;
  scam_type: string;
  evidence: string[];
  simple_warning: string;
  safe_action: string;
  family_alert: string;
  model_source?: ModelSource;
  latency_ms?: number;
  raw_model_output?: string;
};
