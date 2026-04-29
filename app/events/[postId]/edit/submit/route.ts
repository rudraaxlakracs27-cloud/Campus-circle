import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getRenderableCoverImage, isRenderableCoverImage } from "@/lib/media";
import { checkRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { uploadEventCoverImage } from "@/lib/supabase/storage";
import { validateEventPostInput } from "@/lib/validation";
import { CACHE_TAGS, getOwnedPostById, updateEventPost } from "@/lib/store";
import type { PostVisibility } from "@/lib/types";

function getTextValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(request: Request, postId: string, error: string) {
  return NextResponse.redirect(new URL(`/events/${postId}/edit?error=${error}`, request.url));
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ postId: string }>;
  }
) {
  const currentUser = await getSessionUser();
  const { postId } = await context.params;

  if (!currentUser) {
    return NextResponse.redirect(new URL(`/sign-in?redirectTo=/events/${postId}/edit`, request.url));
  }

  const rateLimit = checkRateLimit({
    key: `edit-post:${currentUser.id}:${getRequestIdentifier(request.headers)}`,
    limit: 12,
    windowMs: 10 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    return redirectWithError(request, postId, "rate-limited");
  }

  const existingPost = await getOwnedPostById(postId, currentUser.id);

  if (!existingPost) {
    return NextResponse.redirect(new URL(`/events/${postId}`, request.url));
  }

  const formData = await request.formData();
  const title = getTextValue(formData, "title");
  const description = getTextValue(formData, "description");
  const category = getTextValue(formData, "category");
  const eventDate = getTextValue(formData, "eventDate");
  const location = getTextValue(formData, "location");
  const visibility = getTextValue(formData, "visibility") as PostVisibility;
  const mediaType = getTextValue(formData, "mediaType");
  const coverImageUrl = getTextValue(formData, "coverImage");
  const coverUpload = formData.get("coverUpload");
  const rsvpLink = getTextValue(formData, "rsvpLink");

  const eventError = validateEventPostInput({
    title,
    description,
    category,
    eventDate,
    location,
    visibility,
    mediaType,
    rsvpLink
  });

  if (eventError) {
    return redirectWithError(request, postId, eventError);
  }

  if (coverImageUrl && !isRenderableCoverImage(coverImageUrl)) {
    return redirectWithError(request, postId, "invalid-image-url");
  }

  const uploadedCoverImage =
    coverUpload instanceof File ? await uploadEventCoverImage(coverUpload, currentUser.id) : null;

  if (
    uploadedCoverImage === "invalid-image-type" ||
    uploadedCoverImage === "image-too-large" ||
    uploadedCoverImage === "storage-upload-failed"
  ) {
    return redirectWithError(request, postId, uploadedCoverImage);
  }

  await updateEventPost({
    postId,
    userId: currentUser.id,
    title,
    description,
    category,
    eventDate,
    location,
    visibility: visibility || "PUBLIC",
    mediaType,
    coverImage:
      uploadedCoverImage ||
      coverImageUrl ||
      getRenderableCoverImage(existingPost.coverImage),
    rsvpLink
  });

  revalidateTag(CACHE_TAGS.feed, "max");
  revalidateTag(CACHE_TAGS.feedCategories, "max");
  revalidateTag(CACHE_TAGS.homeStats, "max");
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/events/${postId}`);

  return NextResponse.redirect(new URL(`/events/${postId}?updated=1`, request.url));
}
