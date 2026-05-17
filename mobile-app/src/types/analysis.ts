export type RiskLevel = "safe" | "suspicious" | "dangerous";

export type ScamIdentity = {
  risky_clues: string[];
  safe_clues: string[];
};

export type HowToHandle = {
  what_to_check: string[];
  why_to_check: string[];
  safest_action: string;
};

export type TrustShieldResult = {
  risk_level: RiskLevel;
  confidence: number;
  scam_type: string;
  explanation?: string;
  scam_identity?: ScamIdentity;
  evidence: string[];
  how_to_handle?: HowToHandle;
  simple_warning: string;
  tamil_warning: string;
  safe_action: string;
  family_alert: string;
  model_source?: "mock" | "base_gemma" | "local_fallback";
  fallback_used?: boolean;
  json_valid?: boolean;
  latency_ms?: number;
  raw_model_output?: string;
};
