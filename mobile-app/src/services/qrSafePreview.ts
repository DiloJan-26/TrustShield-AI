import {
  checkSafeLinkPreview,
  type SafeLinkPreviewResult,
  type SafeLinkPreviewStatus,
} from "./safeLinkPreview";

export type QrSafePreviewStatus = SafeLinkPreviewStatus;
export type QrSafePreviewResult = SafeLinkPreviewResult;

export function checkQrSafePreview(url: string): Promise<QrSafePreviewResult> {
  return checkSafeLinkPreview({ url, kind: "qr", source: "qr_barcode" });
}
