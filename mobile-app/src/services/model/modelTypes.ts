import type { QrSafePreviewResult } from "../qrSafePreview";
import type { SafeLinkPreviewResult } from "../safeLinkPreview";
import type { UrlContext } from "../urlIntelligence";

export type ModelMode = "mock" | "base_gemma";

export type ModelSource = "mock" | "base_gemma" | "local_fallback";

export type RiskLevel = "safe" | "suspicious" | "dangerous";

export type TrustShieldPlaybookItem = {
  id: string;
  title: string;
  risk_level: RiskLevel;
  scam_type: string;
  explanation: string;
  safe_action: string;
  user_checklist?: string[];
};

export type TrustShieldModelInput = {
  ocr_text: string;
  detected_urls: string[];
  detected_signals: string[];
  base_risk: RiskLevel;
  rule_risk_hint?: RiskLevel;
  evidence: string[];
  scam_type_hint?: string;
  retrieved_playbook?: TrustShieldPlaybookItem[];
  qr_safe_preview?: QrSafePreviewResult[];
  safe_link_previews?: SafeLinkPreviewResult[];
  url_contexts?: UrlContext[];
  debug_info?: {
    rule_signals?: string[];
    scam_type_hint?: string;
    playbook_ids?: string[];
    extraction_source?: "manual" | "ocr" | "qr" | "ocr_qr";
    qr_preview_used?: boolean;
    url_preview_used?: boolean;
  };
};

export type TrustShieldModelOutput = {
  risk_level: RiskLevel;
  confidence: number;
  scam_type: string;
  explanation: string;
  scam_identity: {
    risky_clues: string[];
    safe_clues: string[];
  };
  evidence: string[];
  how_to_handle: {
    what_to_check: string[];
    why_to_check: string[];
    safest_action: string;
  };
  simple_warning: string;
  safe_action: string;
  family_alert: string;
  model_source?: ModelSource;
  fallback_used?: boolean;
  json_valid?: boolean;
  latency_ms?: number;
  raw_model_output?: string;
  qr_safe_preview?: QrSafePreviewResult[];
  safe_link_previews?: SafeLinkPreviewResult[];
  url_contexts?: UrlContext[];
};
