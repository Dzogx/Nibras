"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
export async function completeIntervention(runId:string,interventionId:string){const s=await createClient(),w=await getCurrentWorkspaceId();const{error}=await s.from("interventions").update({status:"completed"}).eq("id",interventionId).eq("organization_id",w);if(error)return{error:"تعذر تحديث حالة التدخل."};revalidatePath(`/analytics/${runId}`);return{ok:true};}
