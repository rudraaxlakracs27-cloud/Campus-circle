"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { checkRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { clearSessionUser, getSessionUser } from "@/lib/session";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import {
  validateCommentBody,
  validatePasswordInput,
  validateProfileInput,
  validateSignUpInput
} from "@/lib/validation";
import {
  createPostReport,
  createComment,
  CACHE_TAGS,
  deleteEventPost,
  getUserByEmail,
  markNotificationsRead,
  syncAuthUserAccount,
  togglePostInteraction,
  togglePostRsvp,
  toggleSavedPost,
  toggleUserFollow,
  updateUserProfile,
  updateReportStatus
} from "@/lib/store";
import type { InteractionType, ReportStatus, RsvpStatus } from "@/lib/types";

type InlineActionResult =
  | { ok: true }
  | { ok: false; error: "auth" | "invalid" | "rate-limited" | "failed"; message?: string };

function getTextValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function sanitizeAuthErrorMessage(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 180);
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

async function assertActionRateLimit(input: {
  scope: string;
  limit: number;
  windowMs: number;
  subject?: string;
  redirectTo: string;
}) {
  const headerStore = await headers();
  const identifier = input.subject || getRequestIdentifier(headerStore);
  const result = checkRateLimit({
    key: `${input.scope}:${identifier}`,
    limit: input.limit,
    windowMs: input.windowMs
  });

  if (!result.allowed) {
    redirect(input.redirectTo);
  }
}

async function isActionRateLimited(input: {
  scope: string;
  limit: number;
  windowMs: number;
  subject?: string;
}) {
  const headerStore = await headers();
  const identifier = input.subject || getRequestIdentifier(headerStore);
  const result = checkRateLimit({
    key: `${input.scope}:${identifier}`,
    limit: input.limit,
    windowMs: input.windowMs
  });

  return !result.allowed;
}

function revalidateSharedTags(...tags: string[]) {
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
}

export async function signInAction(formData: FormData) {
  const email = getTextValue(formData, "email").toLowerCase();
  const password = getTextValue(formData, "password");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  await assertActionRateLimit({
    scope: "signin",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    subject: email,
    redirectTo: `/sign-in?error=rate-limited&redirectTo=${encodeURIComponent(redirectTo)}`
  });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    redirect(`/sign-in?error=invalid-credentials&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  await syncAuthUserAccount(data.user);
  redirect(redirectTo);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearSessionUser();
  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const fullName = getTextValue(formData, "fullName");
  const usernameInput = getTextValue(formData, "username").replace(/^@+/, "");
  const email = getTextValue(formData, "email").toLowerCase();
  const password = getTextValue(formData, "password");
  const universityId = getTextValue(formData, "universityId");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  const signUpBaseUrl = `/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`;
  await assertActionRateLimit({
    scope: "signup",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    subject: email,
    redirectTo: `${signUpBaseUrl}&error=rate-limited`
  });

  const signupError = validateSignUpInput({
    fullName,
    username: usernameInput,
    email,
    password,
    universityId
  });

  if (signupError) {
    redirect(`${signUpBaseUrl}&error=${signupError}`);
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    redirect(`${signUpBaseUrl}&error=email-taken`);
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      data: {
        full_name: fullName,
        username: usernameInput,
        university_id: universityId
      }
    }
  });

  if (error || !data.user) {
    const message = sanitizeAuthErrorMessage(
      error?.message || "Supabase did not return a user for this signup request."
    );
    redirect(`${signUpBaseUrl}&error=auth-signup-failed&details=${encodeURIComponent(message)}`);
  }

  await syncAuthUserAccount(data.user);
  revalidatePath("/");
  revalidatePath("/profile");

  if (!data.session) {
    redirect(`/sign-in?message=check-email&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  redirect(redirectTo);
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = getTextValue(formData, "email").toLowerCase();
  await assertActionRateLimit({
    scope: "password-reset",
    limit: 4,
    windowMs: 15 * 60 * 1000,
    subject: email,
    redirectTo: "/forgot-password?error=rate-limited"
  });

  if (!email) {
    redirect("/forgot-password?error=missing-email");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`
  });

  if (error) {
    redirect("/forgot-password?error=reset-failed");
  }

  redirect("/sign-in?message=password-reset-sent");
}

export async function updatePasswordAction(formData: FormData) {
  const password = getTextValue(formData, "password");
  const passwordError = validatePasswordInput(password);

  if (passwordError) {
    redirect(`/reset-password?error=${passwordError}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirect("/reset-password?error=update-failed");
  }

  redirect("/sign-in?message=password-reset-success");
}

export async function togglePostInteractionAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const postId = getTextValue(formData, "postId");
  const type = getTextValue(formData, "type") as InteractionType;
  const redirectTo = getTextValue(formData, "redirectTo") || "/";

  if (!postId || (type !== "LIKE" && type !== "INTEREST")) {
    redirect(redirectTo);
  }

  await togglePostInteraction({
    postId,
    userId: currentUser.id,
    type
  });

  revalidatePath("/");
  revalidatePath("/profile");
  redirect(redirectTo);
}

export async function togglePostInteractionInlineAction(input: {
  postId: string;
  type: InteractionType;
}): Promise<InlineActionResult> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return { ok: false, error: "auth" };
  }

  if (!input.postId || (input.type !== "LIKE" && input.type !== "INTEREST")) {
    return { ok: false, error: "invalid" };
  }

  if (
    await isActionRateLimited({
      scope: "interaction-inline",
      limit: 40,
      windowMs: 10 * 60 * 1000,
      subject: currentUser.id
    })
  ) {
    return { ok: false, error: "rate-limited" };
  }

  await togglePostInteraction({
    postId: input.postId,
    userId: currentUser.id,
    type: input.type
  });

  revalidateSharedTags(CACHE_TAGS.feed);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath(`/events/${input.postId}`);
  return { ok: true };
}

export async function togglePostRsvpInlineAction(input: {
  postId: string;
  status: RsvpStatus;
}): Promise<InlineActionResult> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return { ok: false, error: "auth" };
  }

  if (!input.postId || (input.status !== "GOING" && input.status !== "MAYBE")) {
    return { ok: false, error: "invalid" };
  }

  if (
    await isActionRateLimited({
      scope: "rsvp-inline",
      limit: 25,
      windowMs: 10 * 60 * 1000,
      subject: currentUser.id
    })
  ) {
    return { ok: false, error: "rate-limited" };
  }

  await togglePostRsvp({
    postId: input.postId,
    userId: currentUser.id,
    status: input.status
  });

  revalidateSharedTags(CACHE_TAGS.feed);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath("/notifications");
  revalidatePath(`/events/${input.postId}`);
  return { ok: true };
}

export async function createCommentAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const postId = getTextValue(formData, "postId");
  const body = getTextValue(formData, "body");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  await assertActionRateLimit({
    scope: "comment",
    limit: 20,
    windowMs: 10 * 60 * 1000,
    subject: currentUser.id,
    redirectTo: `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=rate-limited`
  });

  if (!postId || validateCommentBody(body)) {
    redirect(redirectTo);
  }

  await createComment({
    postId,
    userId: currentUser.id,
    body
  });

  revalidatePath("/");
  revalidatePath("/profile");
  redirect(redirectTo);
}

export async function createCommentInlineAction(input: {
  postId: string;
  body: string;
  parentId?: string;
}): Promise<InlineActionResult> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return { ok: false, error: "auth" };
  }

  const body = input.body.trim();

  if (!input.postId || validateCommentBody(body)) {
    return { ok: false, error: "invalid" };
  }

  if (
    await isActionRateLimited({
      scope: "comment-inline",
      limit: 20,
      windowMs: 10 * 60 * 1000,
      subject: currentUser.id
    })
  ) {
    return { ok: false, error: "rate-limited" };
  }

  await createComment({
    postId: input.postId,
    userId: currentUser.id,
    body,
    parentId: input.parentId
  });

  revalidateSharedTags(CACHE_TAGS.feed);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath(`/events/${input.postId}`);
  return { ok: true };
}

export async function toggleSavedPostAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const postId = getTextValue(formData, "postId");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  await assertActionRateLimit({
    scope: "post-save",
    limit: 30,
    windowMs: 10 * 60 * 1000,
    subject: currentUser.id,
    redirectTo: `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=rate-limited`
  });

  if (!postId) {
    redirect(redirectTo);
  }

  await toggleSavedPost({
    postId,
    userId: currentUser.id
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath(`/events/${postId}`);
  redirect(redirectTo);
}

export async function toggleSavedPostInlineAction(input: {
  postId: string;
}): Promise<InlineActionResult> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return { ok: false, error: "auth" };
  }

  if (!input.postId) {
    return { ok: false, error: "invalid" };
  }

  if (
    await isActionRateLimited({
      scope: "save-inline",
      limit: 30,
      windowMs: 10 * 60 * 1000,
      subject: currentUser.id
    })
  ) {
    return { ok: false, error: "rate-limited" };
  }

  await toggleSavedPost({
    postId: input.postId,
    userId: currentUser.id
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath(`/events/${input.postId}`);
  return { ok: true };
}

export async function toggleFollowUserAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const followingId = getTextValue(formData, "followingId");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  await assertActionRateLimit({
    scope: "user-follow",
    limit: 30,
    windowMs: 10 * 60 * 1000,
    subject: currentUser.id,
    redirectTo: `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=rate-limited`
  });

  if (!followingId || followingId === currentUser.id) {
    redirect(redirectTo);
  }

  await toggleUserFollow({
    followerId: currentUser.id,
    followingId
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath("/notifications");
  redirect(redirectTo);
}

export async function toggleFollowUserInlineAction(input: {
  followingId: string;
}): Promise<InlineActionResult> {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return { ok: false, error: "auth" };
  }

  if (!input.followingId || input.followingId === currentUser.id) {
    return { ok: false, error: "invalid" };
  }

  if (
    await isActionRateLimited({
      scope: "follow-inline",
      limit: 30,
      windowMs: 10 * 60 * 1000,
      subject: currentUser.id
    })
  ) {
    return { ok: false, error: "rate-limited" };
  }

  await toggleUserFollow({
    followerId: currentUser.id,
    followingId: input.followingId
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/saved");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function updateProfileAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/profile/edit");
  }

  const fullName = getTextValue(formData, "fullName");
  const username = getTextValue(formData, "username").replace(/^@+/, "");
  const bio = getTextValue(formData, "bio");
  const affiliation = getTextValue(formData, "affiliation");
  const interests = getTextValue(formData, "interests")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  await assertActionRateLimit({
    scope: "profile-update",
    limit: 8,
    windowMs: 15 * 60 * 1000,
    subject: currentUser.id,
    redirectTo: "/profile/edit?error=rate-limited"
  });

  const profileError = validateProfileInput({
    fullName,
    username,
    bio,
    affiliation,
    interests
  });

  if (profileError) {
    redirect(`/profile/edit?error=${profileError}`);
  }

  const result = await updateUserProfile({
    userId: currentUser.id,
    fullName,
    username,
    bio,
    affiliation,
    interests
  });

  if ("error" in result && result.error === "username-taken") {
    redirect("/profile/edit?error=username-taken");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      username
    }
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  redirect("/profile?updated=1");
}

export async function deletePostAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const postId = getTextValue(formData, "postId");
  const redirectTo = getTextValue(formData, "redirectTo") || "/profile";
  await assertActionRateLimit({
    scope: "post-delete",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    subject: currentUser.id,
    redirectTo
  });

  if (!postId) {
    redirect(redirectTo);
  }

  await deleteEventPost({
    postId,
    userId: currentUser.id
  });

  revalidateSharedTags(CACHE_TAGS.feed, CACHE_TAGS.feedCategories, CACHE_TAGS.homeStats);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/events/${postId}`);
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}deleted=1`);
}

export async function reportPostAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const postId = getTextValue(formData, "postId");
  const reason = getTextValue(formData, "reason");
  const details = getTextValue(formData, "details");
  const redirectTo = getTextValue(formData, "redirectTo") || "/";
  await assertActionRateLimit({
    scope: "post-report",
    limit: 8,
    windowMs: 10 * 60 * 1000,
    subject: currentUser.id,
    redirectTo: `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=rate-limited`
  });

  if (!postId || !reason) {
    redirect(redirectTo);
  }

  await createPostReport({
    postId,
    reporterId: currentUser.id,
    reason,
    details
  });

  revalidateSharedTags(CACHE_TAGS.moderationReports);
  revalidatePath("/admin/reports");
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}reported=1`);
}

export async function reviewReportAction(formData: FormData) {
  const currentUser = await getSessionUser();

  if (!currentUser || !currentUser.role.toLowerCase().includes("admin")) {
    redirect("/");
  }

  const reportId = getTextValue(formData, "reportId");
  const status = getTextValue(formData, "status") as ReportStatus;

  if (!reportId || (status !== "REVIEWED" && status !== "DISMISSED")) {
    redirect("/admin/reports");
  }

  await updateReportStatus({
    reportId,
    reviewerId: currentUser.id,
    status
  });

  revalidateSharedTags(CACHE_TAGS.moderationReports);
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}

export async function markNotificationsReadAction() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  await markNotificationsRead(currentUser.id);
  revalidatePath("/notifications");
  redirect("/notifications?read=1");
}
