export type RiskLevel = "safe" | "suspicious" | "dangerous";

export type TrustShieldResult = {
  risk_level: RiskLevel;
  confidence: number;
  scam_type: string;
  evidence: string[];
  simple_warning: string;
  tamil_warning: string;
  safe_action: string;
  family_alert: string;
  model_source?: "mock" | "base_gemma" | "local_fallback";
  latency_ms?: number;
  raw_model_output?: string;
};
