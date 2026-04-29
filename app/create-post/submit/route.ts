import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAGS, createEventPost } from "@/lib/store";
import { checkRateLimit, getRequestIdentifier } from "@/lib/rate-limit";
import { isRenderableCoverImage } from "@/lib/media";
import { getSessionUser } from "@/lib/session";
import { uploadEventCoverImage } from "@/lib/supabase/storage";
import { validateEventPostInput } from "@/lib/validation";
import type { PostVisibility } from "@/lib/types";

function getTextValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithError(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/create-post?error=${error}`, request.url));
}

export async function POST(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/sign-in?redirectTo=/create-post", request.url));
  }

  const rateLimit = checkRateLimit({
    key: `create-post:${currentUser.id}:${getRequestIdentifier(request.headers)}`,
    limit: 10,
    windowMs: 10 * 60 * 1000
  });

  if (!rateLimit.allowed) {
    return redirectWithError(request, "rate-limited");
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
    return redirectWithError(request, eventError);
  }

  if (coverImageUrl && !isRenderableCoverImage(coverImageUrl)) {
    return redirectWithError(request, "invalid-image-url");
  }

  const uploadedCoverImage =
    coverUpload instanceof File ? await uploadEventCoverImage(coverUpload, currentUser.id) : null;

  if (
    uploadedCoverImage === "invalid-image-type" ||
    uploadedCoverImage === "image-too-large" ||
    uploadedCoverImage === "storage-upload-failed"
  ) {
    return redirectWithError(request, uploadedCoverImage);
  }

  await createEventPost({
    author: currentUser,
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
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    rsvpLink
  });

  revalidateTag(CACHE_TAGS.feed, "max");
  revalidateTag(CACHE_TAGS.feedCategories, "max");
  revalidateTag(CACHE_TAGS.homeStats, "max");
  revalidatePath("/");
  revalidatePath("/profile");

  return NextResponse.redirect(new URL("/?created=1", request.url));
}
