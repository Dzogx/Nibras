export type AssessmentGrade = "1am" | "2am" | "3am" | "4am";
export type AssessmentSubject = "history" | "geography" | "civic-education";
export type AssessmentDomain = "social-studies" | "civic-education";
export type ScoreAllocation = { subject: AssessmentSubject; points: number };
export function getHistoryGeographyAllocation(grade: AssessmentGrade): ScoreAllocation[] { return grade === "4am" ? [{ subject: "history", points: 13 }, { subject: "geography", points: 7 }] : [{ subject: "history", points: 10 }, { subject: "geography", points: 10 }]; }
export function getDomainTotal(): number { return 20; }
export function validateAllocation(items: Array<{ subject: AssessmentSubject; points: number }>, grade: AssessmentGrade, domain: AssessmentDomain = "social-studies"): string[] { if (domain === "civic-education") return items.every((item) => item.subject === "civic-education") && items.reduce((sum, item) => sum + item.points, 0) === 20 ? [] : ["التربية المدنية يجب أن يساوي مجموعها 20 نقطة."]; const errors: string[] = []; for (const expected of getHistoryGeographyAllocation(grade)) { const actual = items.filter((item) => item.subject === expected.subject).reduce((sum, item) => sum + item.points, 0); if (actual !== expected.points) errors.push(`${expected.subject} يجب أن يساوي ${expected.points} نقاط.`); } return errors; }
