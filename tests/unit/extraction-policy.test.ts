import { describe, expect, it } from "vitest";
import { needsHumanKnowledgeReview, needsOcrFallback } from "@/lib/knowledge/ingestion/extraction-policy";
describe("document extraction policy", () => {
  it("sends sparse native extraction to OCR fallback", () => expect(needsOcrFallback({ pages: [{ pageNumber: 1, text: "قصير", confidence: 0, source: "native-pdf" }], requiresHumanReview: true })).toBe(true));
  it("requires human review for low confidence OCR", () => expect(needsHumanKnowledgeReview({ pages: [{ pageNumber: 1, text: "نص عربي مكتمل وطويل بما يكفي لمراجعة الجملة الموجودة في الصفحة.", confidence: 80, source: "ocr" }], requiresHumanReview: false })).toBe(true));
  it("accepts high-confidence complete page for automated continuation", () => expect(needsHumanKnowledgeReview({ pages: [{ pageNumber: 1, text: "نص عربي مكتمل وطويل بما يكفي لمراجعة الجملة الموجودة في الصفحة.", confidence: 97, source: "ocr" }], requiresHumanReview: false })).toBe(false));
});
