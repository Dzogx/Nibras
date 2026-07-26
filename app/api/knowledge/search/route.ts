import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchOfficialReference } from "@/lib/rag/reference-search";

const querySchema = z.object({ query: z.string().trim().min(2).max(300) });
export function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({ query: request.nextUrl.searchParams.get("query") });
  if (!parsed.success) return NextResponse.json({ error: "أدخل سؤالاً من حرفين على الأقل." }, { status: 400 });
  const results = searchOfficialReference(parsed.data.query, { subject: "history", grade: "1am" });
  return NextResponse.json({ results });
}
