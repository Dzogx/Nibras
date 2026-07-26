import { PDFParse } from "pdf-parse";
import type { DocumentTextExtractor, ExtractionResult } from "@/lib/knowledge/ingestion/types";

export class NativePdfExtractor implements DocumentTextExtractor {
  async extract(file: Uint8Array): Promise<ExtractionResult> {
    const parser = new PDFParse({ data: file });
    try {
      const result = await parser.getText();
      const pages = result.pages.map((page, index) => ({
        pageNumber: index + 1,
        text: page.text.trim(),
        confidence: page.text.trim().length > 40 ? 100 : 0,
        source: "native-pdf" as const
      }));
      return { pages, requiresHumanReview: pages.some((page) => page.confidence < 100) };
    } finally {
      await parser.destroy();
    }
  }
}
