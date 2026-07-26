import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard";
  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);
  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: (values: Array<{ name: string; value: string; options: CookieOptions }>) => values.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => response.cookies.set(name, value, options)) }
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? NextResponse.redirect(`${origin}/login?error=auth_failed`) : response;
}
