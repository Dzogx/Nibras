import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchOfficialReference } from "@/lib/rag/reference-search";
import { searchAnnualPlanCorpus, type CorpusGrade, type CorpusSubject } from "@/lib/rag/corpus-search";

const querySchema = z.object({ query: z.string().trim().min(2).max(300), subject: z.enum(["history", "geography", "civic-education"]).optional(), grade: z.enum(["1am", "2am", "3am", "4am"]).optional() });
export function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({ query: request.nextUrl.searchParams.get("query"), subject: request.nextUrl.searchParams.get("subject") ?? undefined, grade: request.nextUrl.searchParams.get("grade") ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: "أدخل سؤالاً من حرفين على الأقل واختر قيماً صحيحة عند استخدام التصفية." }, { status: 400 });
  const { query, subject, grade } = parsed.data;
  const structured = (!subject || subject === "history") && (!grade || grade === "1am") ? searchOfficialReference(query, { subject: "history", grade: "1am" }) : [];
  const corpus = searchAnnualPlanCorpus(query, { subject: subject as CorpusSubject | undefined, grade: grade as CorpusGrade | undefined });
  return NextResponse.json({ structured, corpus, reviewNotice: "نتائج corpus موثقة بالصفحة والبصمة؛ لا تستخدم لإنشاء خطة أو مورد حتى تمر بالمراجعة البنيوية." });
}
