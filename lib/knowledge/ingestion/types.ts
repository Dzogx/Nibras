export type ExtractedPage = { pageNumber: number; text: string; confidence: number; source: "native-pdf" | "ocr" };
export type ExtractionResult = { pages: ExtractedPage[]; requiresHumanReview: boolean };
export interface DocumentTextExtractor {
  extract(file: Uint8Array): Promise<ExtractionResult>;
}
