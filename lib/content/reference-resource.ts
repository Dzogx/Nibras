import { getReviewedReferencePack, reviewedReferencePacks } from "@/packages/domain/reference-packs/registry";
import { createLessonDraft } from "@/lib/teaching/lesson-draft";
import { toLessonResourceBody, validateLessonResource } from "@/lib/content/lesson-resource";
import type { ReferenceGrade, ReferenceSubject } from "@/packages/domain/reference-packs/types";

export function getSegment(segmentId: string) { return reviewedReferencePacks.find((segment) => segment.id === segmentId); }
export function getLessonResourceFromSegment(segmentId: string) {
  const segment = getSegment(segmentId); if (!segment) return null;
  const body = toLessonResourceBody(createLessonDraft(segment));
  return { segment, body, errors: validateLessonResource(body) };
}
export function getSegments(subject: ReferenceSubject, grade: ReferenceGrade) { return getReviewedReferencePack(subject, grade); }
