import { describe, expect, it } from "vitest";
import { historyGrade1Reference } from "@/packages/domain/reference-packs/history-grade-1";
import { createLessonDraft } from "@/lib/teaching/lesson-draft";
import { toLessonResourceBody, validateLessonResource } from "@/lib/content/lesson-resource";
describe("Content Studio lesson resource", () => {
  it("accepts a source-grounded lesson draft", () => {
    const body = toLessonResourceBody(createLessonDraft(historyGrade1Reference[0]));
    expect(validateLessonResource(body)).toEqual([]);
  });
  it("rejects an educational resource without an evidence source", () => {
    const body = toLessonResourceBody(createLessonDraft(historyGrade1Reference[0]));
    body.source.page = 0;
    expect(validateLessonResource(body)).toContain("مصدر موثق بصفحة وبصمة إلزامي.");
  });
});
