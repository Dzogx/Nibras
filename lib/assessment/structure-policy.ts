import type { AssessmentGrade, AssessmentSubject } from "@/lib/assessment/scoring-policy";
export type AssessmentPart = { label: string; points: number; description: string; sourcePage?: number };
export type AssessmentStructure = { official: boolean; totalPoints: number; parts: AssessmentPart[]; guidance: string };

export function getAssessmentStructure(grade: AssessmentGrade, subject: AssessmentSubject): AssessmentStructure {
  if (grade === "4am" && subject === "history") return { official: true, totalPoints: 13, parts: [{ label: "وضعيات بسيطة", points: 9, description: "3 إلى 4 وضعيات مستقلة تغطي مستويات التفكير ومنهاج التاريخ.", sourcePage: 5 }, { label: "وضعية إدماجية", points: 4, description: "تقييم كفاءات معالجة إشكالية التاريخ الوطني الحديث والمعاصر بسندات وتعليمة.", sourcePage: 5 }], guidance: "دليل بناء موضوع التاريخ والجغرافيا لشهادة التعليم المتوسط 2018." };
  if (grade === "4am" && subject === "geography") return { official: true, totalPoints: 7, parts: [{ label: "وضعيات بسيطة", points: 4, description: "وضعيات مستقلة تغطي مستويات التفكير ومنهاج الجغرافيا.", sourcePage: 5 }, { label: "وضعية إدماجية", points: 3, description: "تقييم كفاءات معالجة إشكالية السكان والتنمية والتهيئة الإقليمية والبيئة.", sourcePage: 5 }], guidance: "دليل بناء موضوع التاريخ والجغرافيا لشهادة التعليم المتوسط 2018." };
  if (grade === "4am" && subject === "civic-education") return { official: true, totalPoints: 20, parts: [{ label: "وضعيتان أو ثلاث وضعيات بسيطة", points: 12, description: "تقييم الموارد وكيفية توظيفها.", sourcePage: 4 }, { label: "وضعية تقويمية مركبة", points: 8, description: "من الواقع المعيش، بسياق وسندات وتعليمة واضحة.", sourcePage: 4 }], guidance: "دليل بناء اختبارات التربية المدنية لشهادة التعليم المتوسط 2018." };
  const totalPoints = subject === "civic-education" ? 20 : 10;
  return { official: false, totalPoints, parts: [], guidance: "المجموع معتمد، أما توزيع النقاط بين الوضعيات فيراجع وفق التدرج والدليل الخاص بالمستوى قبل الاعتماد." };
}
