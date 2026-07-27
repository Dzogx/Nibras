export type AssessmentGrade = "1am" | "2am" | "3am" | "4am";
export type AssessmentSubject = "history" | "geography" | "civic-education";
export type ScoreAllocation = { subject: AssessmentSubject; points: number };

/** User-confirmed scoring policy. Civic education requires its own source-specific rule. */
export function getHistoryGeographyAllocation(grade: AssessmentGrade): ScoreAllocation[] {
  return grade === "4am"
    ? [{ subject: "history", points: 13 }, { subject: "geography", points: 7 }]
    : [{ subject: "history", points: 10 }, { subject: "geography", points: 10 }];
}

export function validateAllocation(items: Array<{ subject: AssessmentSubject; points: number }>, grade: AssessmentGrade): string[] {
  const expected = getHistoryGeographyAllocation(grade); const errors: string[] = [];
  for (const allocation of expected) { const actual = items.filter((item) => item.subject === allocation.subject).reduce((sum, item) => sum + item.points, 0); if (actual !== allocation.points) errors.push(`${allocation.subject} يجب أن يساوي ${allocation.points} نقاط.`); }
  return errors;
}
