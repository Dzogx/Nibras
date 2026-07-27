export type CognitiveLevel = "knowledge" | "comprehension" | "application" | "analysis" | "creation" | "evaluation";
export const cognitiveLevels: Record<CognitiveLevel, { label: string; verbs: string[] }> = {
  knowledge: { label: "المعرفة", verbs: ["اذكر", "عرف", "رتب", "صنف", "حدد", "عين", "استرجع"] },
  comprehension: { label: "الفهم", verbs: ["فسر", "لخص", "وضح", "قارن", "استنتج", "ترجم"] },
  application: { label: "التطبيق", verbs: ["طبق", "استخدم", "وظف", "حل", "اربط", "علل"] },
  analysis: { label: "التحليل", verbs: ["حلل", "ميز", "فهرس", "صنف", "استنبط", "ناقش"] },
  creation: { label: "التركيب / الابتكار", verbs: ["صمم", "اقترح", "خطط", "أنشئ", "ألف", "ابتكر"] },
  evaluation: { label: "التقويم", verbs: ["قيم", "برر", "انتقد", "احكم", "وازن", "دافع"] }
};
export function instructionMatchesLevel(instruction: string, level: CognitiveLevel): boolean { return cognitiveLevels[level].verbs.some((verb) => instruction.includes(verb)); }
