import type { ReferenceGrade, ReferenceSegment, ReferenceSubject } from "@/packages/domain/reference-packs/types";
import { historyGrade1Reference } from "@/packages/domain/reference-packs/history-grade-1";
import { geographyGrade1Reference } from "@/packages/domain/reference-packs/geography-grade-1";
import { civicEducationGrade1Reference } from "@/packages/domain/reference-packs/civic-education-grade-1";
import { historyGrade2Reference } from "@/packages/domain/reference-packs/history-grade-2";
import { civicEducationGrade2Reference } from "@/packages/domain/reference-packs/civic-education-grade-2";
export const reviewedReferencePacks: ReferenceSegment[] = [...historyGrade1Reference, ...geographyGrade1Reference, ...civicEducationGrade1Reference, ...historyGrade2Reference, ...civicEducationGrade2Reference];
export function getReviewedReferencePack(subject: ReferenceSubject, grade: ReferenceGrade): ReferenceSegment[] { return reviewedReferencePacks.filter((segment) => segment.subject === subject && segment.grade === grade); }
