import Link from "next/link";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";

export default async function DashboardPage() {
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const [classes, plans, resources, assessments, interventions, nextItems] = await Promise.all([
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("organization_id", workspaceId),
    supabase.from("annual_plans").select("id", { count: "exact", head: true }).eq("organization_id", workspaceId),
    supabase.from("content_items").select("id", { count: "exact", head: true }).eq("organization_id", workspaceId),
    supabase.from("summative_assessments").select("id", { count: "exact", head: true }).eq("organization_id", workspaceId),
    supabase.from("interventions").select("id", { count: "exact", head: true }).eq("organization_id", workspaceId).eq("status", "planned"),
    supabase.from("plan_items").select("id,title,annual_plan_id,planned_minutes").eq("organization_id", workspaceId).in("status", ["planned", "in_progress", "needs_intervention"]).order("sort_order").limit(3)
  ]);
  const metrics = [["الأقسام", classes.count ?? 0, "/planner"], ["الخطط", plans.count ?? 0, "/planner"], ["الموارد", resources.count ?? 0, "/studio"], ["التقويمات", assessments.count ?? 0, "/assessment"]] as const;
  return <section><p className="text-sm font-semibold text-emerald-700">مساحة عمل الأستاذ</p><h1 className="mt-1 text-3xl font-bold">لوحة نبراس</h1><p className="mt-2 text-slate-600">تابع تقدمك من المرجع المعتمد إلى التنفيذ والتقويم والعلاج.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label,value,href])=><Link key={label} href={href as Route} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300"><b className="text-3xl text-emerald-700">{value}</b><p className="mt-1 text-sm text-slate-600">{label} محفوظة</p></Link>)}</div><div className="mt-7 grid gap-5 lg:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><h2 className="font-bold">الخطوة التعليمية التالية</h2><Link href={"/planner" as Route} className="text-sm text-emerald-700">فتح الخطة</Link></div>{nextItems.data?.length?<div className="mt-4 space-y-3">{nextItems.data.map(item=><Link key={item.id} href={`/plans/${item.annual_plan_id}` as Route} className="block rounded-lg bg-slate-50 p-3 hover:bg-emerald-50"><b>{item.title}</b><p className="mt-1 text-xs text-slate-600">{item.planned_minutes ?? "—"} دقيقة</p></Link>)}</div>:<p className="mt-4 text-sm text-slate-600">أضف قسماً وخطة وبنوداً لتظهر الخطوة التالية.</p>}</article><article className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">العلاج والإثراء</h2><p className="mt-3 text-sm text-amber-900">لديك <b>{interventions.count ?? 0}</b> تدخلات مخططة تحتاج متابعة.</p><Link href={"/analytics" as Route} className="mt-4 inline-block text-sm font-semibold text-amber-800">فتح التحليلات ←</Link></article></div></section>;
}
