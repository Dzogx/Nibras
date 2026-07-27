import Link from "next/link";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { reviewLessonResource } from "@/lib/inspector/review";

type LessonBody = { targetedCompetence: string; evidenceOfLearning: string; activity: { instruction: string; durationMinutes: number }; formativeAssessment: string; source: { page: number } };
export default async function InspectorPage() {
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const { data } = await supabase.from("content_items").select("id,title,body").eq("organization_id", workspaceId).eq("content_type", "lesson_plan").order("created_at", { ascending: false });
  return <section><p className="text-sm font-semibold text-emerald-700">Inspector Mode</p><h1 className="mt-1 text-3xl font-bold">مراجعة الموارد التربوية</h1><p className="mt-2 text-slate-600">مراجعة عملية للمصدر والكفاءة والزمن والتعليمات والتقويم قبل اعتماد المورد.</p><div className="mt-7 grid gap-4 lg:grid-cols-2">{(data ?? []).map((item) => {
    const body = item.body as LessonBody;
    const review = reviewLessonResource({ competence: body.targetedCompetence, evidence: body.evidenceOfLearning, activity: body.activity.instruction, minutes: body.activity.durationMinutes, assessment: body.formativeAssessment, sourcePage: body.source.page });
    const risks = review.findings.filter((finding) => finding.level === "risk").length;
    return <Link key={item.id} href={`/studio/${item.id}` as Route} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300"><div className="flex justify-between gap-3"><b>{item.title}</b><b className="text-emerald-700">{review.score}/100</b></div><p className="mt-3 text-sm text-slate-600">{risks ? `${risks} نقاط تحتاج تحسيناً.` : "المورد يستوفي معايير المراجعة الأساسية."}</p></Link>;
  })}{!data?.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">لا توجد موارد محفوظة للمراجعة بعد.</p>}</div></section>;
}
