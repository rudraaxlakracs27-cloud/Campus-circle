import type { PostVisibility } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z\s.'-]{1,79}$/;

function isReasonableDate(value: string) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isLikelyHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateSignUpInput(input: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  universityId: string;
}) {
  if (!input.fullName || !input.username || !input.email || !input.password || !input.universityId) {
    return "missing-fields" as const;
  }

  if (!NAME_PATTERN.test(input.fullName)) {
    return "invalid-name" as const;
  }

  if (!USERNAME_PATTERN.test(input.username)) {
    return "invalid-username" as const;
  }

  if (!input.email.includes("@")) {
    return "invalid-email" as const;
  }

  if (input.password.length < 8) {
    return "weak-password" as const;
  }

  return null;
}

export function validatePasswordInput(password: string) {
  if (!password) {
    return "missing-password" as const;
  }

  if (password.length < 8) {
    return "weak-password" as const;
  }

  return null;
}

export function validateProfileInput(input: {
  fullName: string;
  username: string;
  bio: string;
  affiliation: string;
  interests: string[];
}) {
  if (!input.fullName || !input.username || !input.bio || !input.affiliation || input.interests.length === 0) {
    return "missing-fields" as const;
  }

  if (!NAME_PATTERN.test(input.fullName)) {
    return "invalid-name" as const;
  }

  if (!USERNAME_PATTERN.test(input.username)) {
    return "invalid-username" as const;
  }

  if (input.bio.length < 20 || input.bio.length > 320) {
    return "invalid-bio" as const;
  }

  if (input.affiliation.length < 2 || input.affiliation.length > 80) {
    return "invalid-affiliation" as const;
  }

  if (input.interests.length === 0 || input.interests.length > 8) {
    return "invalid-interests" as const;
  }

  return null;
}

export function validateCommentBody(body: string) {
  const trimmed = body.trim();

  if (!trimmed) {
    return "invalid" as const;
  }

  if (trimmed.length < 2 || trimmed.length > 500) {
    return "invalid" as const;
  }

  return null;
}

export function validateEventPostInput(input: {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  location: string;
  visibility: string;
  mediaType: string;
  rsvpLink?: string;
}) {
  if (!input.title || !input.description || !input.category || !input.eventDate || !input.location || !input.mediaType) {
    return "missing-fields" as const;
  }

  if (input.title.length < 6 || input.title.length > 100) {
    return "invalid-title" as const;
  }

  if (input.description.length < 24 || input.description.length > 2000) {
    return "invalid-description" as const;
  }

  if (input.category.length < 3 || input.category.length > 40) {
    return "invalid-category" as const;
  }

  if (input.location.length < 3 || input.location.length > 120) {
    return "invalid-location" as const;
  }

  if (input.mediaType.length < 3 || input.mediaType.length > 60) {
    return "invalid-media-type" as const;
  }

  if (!isReasonableDate(input.eventDate)) {
    return "invalid-event-date" as const;
  }

  if (!["PUBLIC", "VERIFIED_ONLY", "CAMPUS_ONLY"].includes(input.visibility as PostVisibility)) {
    return "invalid-visibility" as const;
  }

  if (!isLikelyHttpUrl(input.rsvpLink ?? "")) {
    return "invalid-rsvp-link" as const;
  }

  return null;
}
