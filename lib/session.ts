import { cookies } from "next/headers";
import { cache } from "react";
import { getUserByEmail, syncAuthUserAccount } from "@/lib/store";
import { hasSupabaseAuthCookies } from "@/lib/supabase/auth-cookies";
import { createClient } from "@/lib/supabase/server";

function getClaimEmail(claims: Record<string, unknown> | undefined) {
  const email = claims?.email;
  return typeof email === "string" && email ? email.toLowerCase() : null;
}

export const getSessionUser = cache(async () => {
  const cookieStore = await cookies();

  if (!hasSupabaseAuthCookies(cookieStore.getAll())) {
    return null;
  }

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const email = getClaimEmail((claimsResult.data?.claims ?? undefined) as Record<string, unknown> | undefined);

  if (!email) {
    return null;
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return syncAuthUserAccount(user);
});

export async function setSessionUser(userId: string) {
  return userId;
}

export async function clearSessionUser() {
  return;
}
