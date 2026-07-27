import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { analyzeMastery, treatmentSuggestion } from "@/lib/analytics/mastery";

const schema = z.object({
  assessmentId: z.string().uuid(),
  conductedOn: z.string().date(),
  participantCount: z.number().int().min(1).max(80),
  results: z.array(z.object({
    criterion: z.string().trim().min(3).max(300),
    masteredCount: z.number().int().min(0),
    commonError: z.string().trim().max(2000).optional()
  })).min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات النتائج المجمعة غير صالحة." }, { status: 400 });
  const payload = parsed.data;
  if (payload.results.some((result) => result.masteredCount > payload.participantCount)) return NextResponse.json({ error: "عدد المتحكمين لا يمكن أن يتجاوز عدد المشاركين." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  const workspaceId = await getCurrentWorkspaceId();
  const { data: assessment } = await supabase.from("summative_assessments").select("id,class_id").eq("id", payload.assessmentId).eq("organization_id", workspaceId).single();
  if (!assessment) return NextResponse.json({ error: "التقويم التحصيلي غير متاح." }, { status: 404 });

  const { data: run, error: runError } = await supabase.from("assessment_runs").insert({ organization_id: workspaceId, assessment_id: assessment.id, class_id: assessment.class_id, conducted_on: payload.conductedOn, participant_count: payload.participantCount, created_by: user.id }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: "تعذر حفظ تنفيذ التقويم." }, { status: 500 });

  const insights = analyzeMastery(payload.results.map((result) => ({ criterion: result.criterion, assessedCount: payload.participantCount, masteredCount: result.masteredCount, commonError: result.commonError })));
  const { error: resultsError } = await supabase.from("aggregated_results").insert(insights.map((insight) => ({ assessment_run_id: run.id, criterion_label: insight.criterion, assessed_count: insight.assessedCount, mastered_count: insight.masteredCount, common_error: insight.commonError ?? null })));
  if (resultsError) return NextResponse.json({ error: "تم حفظ التنفيذ لكن تعذر حفظ النتائج." }, { status: 500 });

  const priorityMap = { high: 1, medium: 2, low: 3 } as const;
  const actionable = insights.filter((insight) => insight.recommendation !== "monitor");
  if (actionable.length) {
    const { data: patterns } = await supabase.from("error_patterns").insert(actionable.map((insight) => ({ organization_id: workspaceId, class_id: assessment.class_id, assessment_run_id: run.id, pattern: insight.commonError || insight.criterion, evidence: `نسبة الإتقان: ${insight.masteryRate}%`, priority: priorityMap[insight.priority] }))).select("id,pattern");
    if (patterns) await supabase.from("interventions").insert(actionable.map((insight, index) => {
      const suggestion = treatmentSuggestion(insight);
      return { organization_id: workspaceId, class_id: assessment.class_id, error_pattern_id: patterns[index]?.id ?? null, intervention_type: insight.recommendation, title: suggestion.title, activity: insight.recommendation === "remediation" ? `نشاط موجه لمعالجة: ${insight.commonError || insight.criterion}` : `مهمة إثرائية موسعة حول: ${insight.criterion}`, duration_minutes: suggestion.durationMinutes, success_indicator: suggestion.successIndicator, created_by: user.id };
    }));
  }
  return NextResponse.json({ runId: run.id, insights }, { status: 201 });
}
