import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { validateAllocation, type AssessmentGrade, type AssessmentSubject } from "@/lib/assessment/scoring-policy";
import { getAssessmentStructure } from "@/lib/assessment/structure-policy";
import type { CognitiveLevel } from "@/lib/assessment/cognitive-levels";

const levels = ["knowledge", "comprehension", "application", "analysis", "creation", "evaluation"] as const;
const payloadSchema = z.object({ grade: z.enum(["1am", "2am", "3am", "4am"]), subject: z.enum(["history", "geography", "civic-education"]), title: z.string().trim().min(3).max(300), durationMinutes: z.number().int().min(10).max(240), items: z.array(z.object({ title: z.string().trim().min(3).max(300), level: z.enum(levels), points: z.number().positive().max(100), instruction: z.string().trim().min(3).max(5000) })).min(1) });

export async function POST(request: Request) {
  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "بيانات التقويم التحصيلي غير مكتملة." }, { status: 400 });
  const { grade, subject, items, title, durationMinutes } = payload.data;
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const expectedTotal = getAssessmentStructure(grade as AssessmentGrade, subject as AssessmentSubject).totalPoints;
  if (totalPoints !== expectedTotal) return NextResponse.json({ error: `مجموع النقاط يجب أن يساوي ${expectedTotal} نقطة.` }, { status: 400 });
  const subjectAllocationError = subject === "civic-education" ? [] : validateAllocation(items.map((item) => ({ subject, points: item.points })) as Array<{ subject: AssessmentSubject; points: number }>, grade as AssessmentGrade);
  if (subjectAllocationError.length > 0) return NextResponse.json({ error: subjectAllocationError[0] }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  const workspaceId = await getCurrentWorkspaceId();
  const [{ data: subjectRow }, { data: gradeRow }] = await Promise.all([supabase.from("subjects").select("id").eq("code", subject).single(), supabase.from("grade_levels").select("id").eq("code", grade).single()]);
  if (!subjectRow || !gradeRow) return NextResponse.json({ error: "تعذر تحديد المادة أو المستوى من المرجع." }, { status: 409 });
  const { data: assessment, error: assessmentError } = await supabase.from("summative_assessments").insert({ organization_id: workspaceId, subject_id: subjectRow.id, grade_level_id: gradeRow.id, title, duration_minutes: durationMinutes, total_points: totalPoints, created_by: user.id }).select("id").single();
  if (assessmentError || !assessment) return NextResponse.json({ error: "تعذر حفظ التقويم التحصيلي." }, { status: 500 });
  const { error: itemsError } = await supabase.from("summative_assessment_items").insert(items.map((item, index) => ({ assessment_id: assessment.id, subject_id: subjectRow.id, cognitive_level: item.level as CognitiveLevel, instruction: item.instruction, points: item.points, sort_order: index, expected_answer: { title: item.title } })));
  if (itemsError) { await supabase.from("summative_assessments").delete().eq("id", assessment.id); return NextResponse.json({ error: "تعذر حفظ عناصر التقويم؛ لم يتم الاحتفاظ بمسودة ناقصة." }, { status: 500 }); }
  return NextResponse.json({ id: assessment.id }, { status: 201 });
}
