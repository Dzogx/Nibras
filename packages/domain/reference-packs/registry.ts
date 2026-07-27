import type { ReferenceGrade, ReferenceSegment, ReferenceSubject } from "@/packages/domain/reference-packs/types";
import { historyGrade1Reference } from "@/packages/domain/reference-packs/history-grade-1";
import { geographyGrade1Reference } from "@/packages/domain/reference-packs/geography-grade-1";
import { civicEducationGrade1Reference } from "@/packages/domain/reference-packs/civic-education-grade-1";
import { historyGrade2Reference } from "@/packages/domain/reference-packs/history-grade-2";
import { civicEducationGrade2Reference } from "@/packages/domain/reference-packs/civic-education-grade-2";
import { historyGrade3Reference } from "@/packages/domain/reference-packs/history-grade-3";
import { geographyGrade3Reference } from "@/packages/domain/reference-packs/geography-grade-3";
import { geographyGrade2Reference } from "@/packages/domain/reference-packs/geography-grade-2";
import { civicEducationGrade3Reference } from "@/packages/domain/reference-packs/civic-education-grade-3";
import { historyGrade4Reference } from "@/packages/domain/reference-packs/history-grade-4";
import { geographyGrade4Reference } from "@/packages/domain/reference-packs/geography-grade-4";
import { civicEducationGrade4Reference } from "@/packages/domain/reference-packs/civic-education-grade-4";
export const reviewedReferencePacks: ReferenceSegment[] = [...historyGrade1Reference, ...geographyGrade1Reference, ...civicEducationGrade1Reference, ...historyGrade2Reference, ...civicEducationGrade2Reference, ...historyGrade3Reference, ...geographyGrade2Reference, ...geographyGrade3Reference, ...civicEducationGrade3Reference, ...historyGrade4Reference, ...geographyGrade4Reference, ...civicEducationGrade4Reference];
export function getReviewedReferencePack(subject: ReferenceSubject, grade: ReferenceGrade): ReferenceSegment[] { return reviewedReferencePacks.filter((segment) => segment.subject === subject && segment.grade === grade); }
