import type { ExtractionResult } from "@/lib/knowledge/ingestion/types";

const MIN_NATIVE_TEXT_CHARACTERS = 40;
const MIN_OCR_CONFIDENCE_FOR_AUTO_REVIEW = 92;

export function needsOcrFallback(result: ExtractionResult): boolean {
  return result.pages.length === 0 || result.pages.some((page) => page.text.length < MIN_NATIVE_TEXT_CHARACTERS);
}

export function needsHumanKnowledgeReview(result: ExtractionResult): boolean {
  return result.pages.some((page) => page.source === "ocr" && page.confidence < MIN_OCR_CONFIDENCE_FOR_AUTO_REVIEW) || result.pages.some((page) => page.text.length < MIN_NATIVE_TEXT_CHARACTERS);
}
