"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
const schema=z.object({minutes:z.coerce.number().int().min(1).max(600)});
export type ConfirmRunState={error?:string;ok?:boolean};
export async function confirmPlanItemRun(planId:string,itemId:string,_state:ConfirmRunState,formData:FormData):Promise<ConfirmRunState>{const p=schema.safeParse({minutes:formData.get("minutes")});if(!p.success)return{error:"أدخل زمناً فعلياً صالحاً."};const s=await createClient(),w=await getCurrentWorkspaceId();const{data:{user}}=await s.auth.getUser();if(!user)return{error:"انتهت الجلسة."};const{data:item}=await s.from("plan_items").select("id,title").eq("id",itemId).eq("annual_plan_id",planId).eq("organization_id",w).single();if(!item)return{error:"بند الخطة غير متاح."};const today=new Date().toISOString().slice(0,10);const{error:runError}=await s.from("lesson_runs").insert({organization_id:w,plan_item_id:item.id,executed_on:today,actual_minutes:p.data.minutes,confirmed_by:user.id});if(runError)return{error:"تعذر تأكيد تنفيذ الحصة."};await s.from("plan_items").update({status:"completed"}).eq("id",item.id);await s.from("memory_events").insert({organization_id:w,plan_item_id:item.id,event_type:"lesson_executed",summary:`تم تنفيذ: ${item.title}`,source_type:"teacher_confirmed",confirmed_at:new Date().toISOString(),created_by:user.id});revalidatePath(`/plans/${planId}`);return{ok:true};}
