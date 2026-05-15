export type ModelMode = "mock" | "base_gemma" | "finetuned_gemma";

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
};
