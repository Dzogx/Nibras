import { ClassForm } from "@/components/planner/class-form";
import { PlanForm } from "@/components/planner/plan-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";

type Option = { id: string; name_ar?: string; name?: string };
export default async function PlannerPage() {
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const [{ data: subjects }, { data: grades }, { data: years }, { data: classes }] = await Promise.all([
    supabase.from("subjects").select("id,name_ar").order("name_ar"), supabase.from("grade_levels").select("id,name_ar").order("sort_order"), supabase.from("academic_years").select("id,code").order("starts_on", { ascending: false }), supabase.from("classes").select("id,name,learner_count,subjects(name_ar),grade_levels(name_ar)").eq("organization_id", workspaceId).order("created_at", { ascending: false })
  ]);
  const options = (items: Option[] | null, nameKey: "name_ar" | "name") => (items ?? []).map((item) => ({ id: item.id, name: item[nameKey] ?? "" }));
  return <section><p className="text-sm font-semibold text-emerald-700">Teacher OS</p><h1 className="mt-1 text-3xl font-bold">الخطة والأقسام</h1><p className="mt-2 text-slate-600">ابدأ بتسجيل القسم، ثم اربط مخططه ومقاطعه وموارده بالتقدم الفعلي.</p><div className="mt-7"><ClassForm subjects={options(subjects, "name_ar")} grades={options(grades, "name_ar")} years={(years ?? []).map((year) => ({ id: year.id, name: year.code }))} /></div><div className="mt-8"><h2 className="text-lg font-bold">الأقسام المسجلة</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{(classes ?? []).map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><b>{item.name}</b><p className="mt-1 text-sm text-slate-600">{item.subjects?.[0]?.name_ar ?? "—"} · {item.grade_levels?.[0]?.name_ar ?? "—"} · {item.learner_count ?? "—"} تلميذاً</p></article>)}{!classes?.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">لا توجد أقسام بعد. أضف القسم الأول لبدء التخطيط.</p>}</div><div className="mt-8"><h2 className="text-lg font-bold">إنشاء خطة سنوية</h2><PlanForm classes={(classes ?? []).map((item) => ({ id: item.id, name: item.name, label: `${item.subjects?.[0]?.name_ar ?? "—"} · ${item.grade_levels?.[0]?.name_ar ?? "—"}` }))} /></div></div></section>;
}
