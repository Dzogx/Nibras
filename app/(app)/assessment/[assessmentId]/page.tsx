import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { AssessmentPrintDocument } from "@/components/assessment/assessment-print-document";
import { PrintButton } from "@/components/assessment/print-button";
export default async function AssessmentDetailPage({ params }: { params: Promise<{ assessmentId: string }> }) { const { assessmentId } = await params; const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId(); const { data: assessment } = await supabase.from("summative_assessments").select("id,title,duration_minutes,total_points,grade_levels(name_ar),subjects(name_ar),summative_assessment_items(instruction,points,cognitive_level,sort_order,expected_answer)").eq("id", assessmentId).eq("organization_id", workspaceId).single(); if (!assessment) notFound(); return <section><div className="no-print flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-700">Assessment Bank</p><h1 className="mt-1 text-3xl font-bold">{assessment.title}</h1></div><div className="flex gap-2"><Link href={"/assessment" as Route} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">العودة إلى التقويمات</Link><PrintButton /></div></div><div className="mt-7"><AssessmentPrintDocument assessment={assessment} /></div></section>; }
