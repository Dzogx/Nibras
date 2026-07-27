import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSegments } from "@/lib/content/reference-resource";
const schema = z.object({ subject: z.enum(["history", "geography", "civic-education"]), grade: z.enum(["1am", "2am", "3am", "4am"]) });
export function GET(request: NextRequest) { const parsed = schema.safeParse({ subject: request.nextUrl.searchParams.get("subject"), grade: request.nextUrl.searchParams.get("grade") }); if (!parsed.success) return NextResponse.json({ error: "المادة أو المستوى غير صالح." }, { status: 400 }); return NextResponse.json({ segments: getSegments(parsed.data.subject, parsed.data.grade) }); }
