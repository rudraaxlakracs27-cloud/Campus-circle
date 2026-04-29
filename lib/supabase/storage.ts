import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_BUCKET = "event-media";

function getStorageBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;
}

function getSafeFileExtension(file: File) {
  const originalName = file.name.toLowerCase();
  if (originalName.endsWith(".png")) {
    return ".png";
  }
  if (originalName.endsWith(".webp")) {
    return ".webp";
  }
  if (originalName.endsWith(".gif")) {
    return ".gif";
  }
  return ".jpg";
}

export async function uploadEventCoverImage(file: File, userId: string) {
  if (!file.size) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    return "invalid-image-type" as const;
  }

  const maxFileSize = 5 * 1024 * 1024;
  if (file.size > maxFileSize) {
    return "image-too-large" as const;
  }

  const supabase = await createClient();
  const bucket = getStorageBucket();
  const filePath = `covers/${userId}/${randomUUID()}${getSafeFileExtension(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (error) {
    const message = error.message.toLowerCase();
    const hint =
      message.includes("bucket") && message.includes("not found")
        ? "bucket-missing"
        : message.includes("row-level security") || message.includes("permission")
          ? "policy-blocked"
          : message.includes("jwt") || message.includes("auth") || message.includes("token")
            ? "auth-failed"
            : "unknown";

    console.error("[storage] Failed to upload event cover image.", {
      bucket,
      contentType: file.type,
      fileName: file.name,
      filePath,
      hint,
      size: file.size,
      userId,
      error
    });
    return "storage-upload-failed" as const;
  }

  const {
    data: { publicUrl }
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}
