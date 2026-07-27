import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { ResourceEditor } from "@/components/studio/resource-editor";
export default async function EditResourcePage({params}:{params:Promise<{contentId:string}>}){const{contentId}=await params;const s=await createClient(),w=await getCurrentWorkspaceId();const{data:content}=await s.from("content_items").select("title,body").eq("id",contentId).eq("organization_id",w).single();if(!content)notFound();return <section><p className="text-sm font-semibold text-emerald-700">Content Studio</p><h1 className="mt-1 text-3xl font-bold">تعديل المورد</h1><p className="mt-2 text-slate-600">سيحفظ التعديل كإصدار جديد مع الاحتفاظ بالنسخ السابقة.</p><div className="mt-7 max-w-4xl"><ResourceEditor contentId={contentId} title={content.title} body={content.body as never}/></div></section>}
