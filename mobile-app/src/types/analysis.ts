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
};
