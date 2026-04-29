import { NextResponse } from "next/server";
import { clearSessionUser } from "@/lib/session";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  await clearSessionUser();

  return NextResponse.redirect(new URL("/", request.url));
}
