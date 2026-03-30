import { syncAuthUserAccount } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return syncAuthUserAccount(user);
}

export async function setSessionUser(userId: string) {
  return userId;
}

export async function clearSessionUser() {
  return;
}
