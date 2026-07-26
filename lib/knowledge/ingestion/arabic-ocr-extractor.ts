import { createWorker } from "tesseract.js";
import type { DocumentTextExtractor, ExtractionResult } from "@/lib/knowledge/ingestion/types";

/**
 * OCR fallback is intentionally page-image based. PDF rasterization belongs to the
 * worker/container boundary; this adapter accepts page images supplied by that worker.
 */
export class ArabicOcrPageExtractor implements DocumentTextExtractor {
  async extract(file: Uint8Array): Promise<ExtractionResult> {
    void file;
    throw new Error("Arabic OCR requires rasterized page images from the ingestion worker.");
  }

  async extractPageImage(image: string | Uint8Array, pageNumber: number): Promise<ExtractionResult["pages"][number]> {
    const worker = await createWorker("ara+eng");
    try {
      const input = typeof image === "string" ? image : Buffer.from(image);
      const { data } = await worker.recognize(input);
      return { pageNumber, text: data.text.trim(), confidence: Math.round(data.confidence * 100) / 100, source: "ocr" };
    } finally {
      await worker.terminate();
    }
  }
}
