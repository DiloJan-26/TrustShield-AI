import { scanBarcodes } from "../native/TrustShieldBarcode";
import { recognizeText } from "../native/TrustShieldOCR";
import { extractUrls } from "./scamSignalExtractor";
import { analyzeUrlsLocally, type UrlContext } from "./urlIntelligence";

export type BarcodeContextItem = {
  raw_value: string;
  display_value?: string;
  format?: string;
  value_type?: string;
};

export type ImageContextResult = {
  imageUri?: string;
  ocr_text: string;
  ocr_lines: string[];
  ocr_blocks: string[];
  barcode_values: string[];
  barcode_items: BarcodeContextItem[];
  combined_text: string;
  urls: string[];
  visible_text_urls: string[];
  qr_barcode_urls: string[];
  all_urls: string[];
  url_contexts: UrlContext[];
  context_summary: {
    has_ocr_text: boolean;
    has_barcode: boolean;
    url_count: number;
  };
};

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function buildCombinedText(ocrText: string, barcodeValues: string[]): string {
  const sections: string[] = [];

  if (ocrText.trim()) {
    sections.push(`Visible text:\n${ocrText.trim()}`);
  }

  if (barcodeValues.length > 0) {
    sections.push(`QR / barcode content:\n${barcodeValues.join("\n")}`);
  }

  return sections.join("\n\n");
}

export function buildBarcodeOnlyContext(barcodeItems: BarcodeContextItem[]): ImageContextResult {
  const barcodeValues = unique(
    barcodeItems.map((item) => item.raw_value || item.display_value || ""),
  );
  const combinedText = buildCombinedText("", barcodeValues);
  const qrBarcodeUrls = unique(barcodeValues.flatMap((value) => extractUrls(value)));
  const urlContexts = analyzeUrlsLocally(qrBarcodeUrls, "qr_barcode");

  return {
    ocr_text: "",
    ocr_lines: [],
    ocr_blocks: [],
    barcode_values: barcodeValues,
    barcode_items: barcodeItems.filter((item) => item.raw_value.trim().length > 0),
    combined_text: combinedText,
    urls: qrBarcodeUrls,
    visible_text_urls: [],
    qr_barcode_urls: qrBarcodeUrls,
    all_urls: qrBarcodeUrls,
    url_contexts: urlContexts,
    context_summary: {
      has_ocr_text: false,
      has_barcode: barcodeValues.length > 0,
      url_count: qrBarcodeUrls.length,
    },
  };
}

export async function extractImageContext(imageUri: string): Promise<ImageContextResult> {
  const [ocrResult, barcodeResult] = await Promise.allSettled([
    recognizeText(imageUri),
    scanBarcodes(imageUri),
  ]);

  const ocr =
    ocrResult.status === "fulfilled"
      ? ocrResult.value
      : { full_text: "", lines: [], blocks: [] };
  const barcode =
    barcodeResult.status === "fulfilled"
      ? barcodeResult.value
      : { barcodes: [], raw_values: [] };

  const ocrText = ocr.full_text.trim();
  const barcodeValues = unique(barcode.raw_values);
  const combinedText = buildCombinedText(ocrText, barcodeValues);

  if (!ocrText && barcodeValues.length === 0) {
    throw new Error(
      "Could not read text or QR content from this image. Please try a clearer screenshot.",
    );
  }

  const visibleTextUrls = unique(extractUrls(ocrText));
  const qrBarcodeUrls = unique(barcodeValues.flatMap((value) => extractUrls(value)));
  const allUrls = unique([...visibleTextUrls, ...qrBarcodeUrls]);
  const urlContexts = [
    ...analyzeUrlsLocally(visibleTextUrls, "visible_text"),
    ...analyzeUrlsLocally(qrBarcodeUrls, "qr_barcode"),
  ];

  return {
    imageUri,
    ocr_text: ocrText,
    ocr_lines: ocr.lines,
    ocr_blocks: ocr.blocks,
    barcode_values: barcodeValues,
    barcode_items: barcode.barcodes.filter((item) => item.raw_value.trim().length > 0),
    combined_text: combinedText,
    urls: allUrls,
    visible_text_urls: visibleTextUrls,
    qr_barcode_urls: qrBarcodeUrls,
    all_urls: allUrls,
    url_contexts: urlContexts,
    context_summary: {
      has_ocr_text: ocrText.length > 0,
      has_barcode: barcodeValues.length > 0,
      url_count: allUrls.length,
    },
  };
}
