"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
export async function linkContentToPlanItem(contentId:string,formData:FormData){const planItemId=formData.get("planItemId");if(typeof planItemId!=="string"||!planItemId)return{error:"اختر بنداً من الخطة."};const s=await createClient(),w=await getCurrentWorkspaceId();const{data:item}=await s.from("plan_items").select("id").eq("id",planItemId).eq("organization_id",w).single();if(!item)return{error:"بند الخطة غير متاح."};const{error}=await s.from("content_items").update({plan_item_id:item.id}).eq("id",contentId).eq("organization_id",w);if(error)return{error:"تعذر ربط المورد بالخطة."};revalidatePath(`/studio/${contentId}`);return{ok:true};}
