const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80";

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["images.unsplash.com", "techcrunch.com", "www.techcrunch.com"]);

function isLocalMediaPath(value: string) {
  return value.startsWith("/");
}

function looksLikeImagePathname(pathname: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(pathname);
}

export function isRenderableCoverImage(value: string) {
  if (!value) {
    return false;
  }

  if (isLocalMediaPath(value)) {
    return true;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(url.hostname)) {
      return false;
    }

    return looksLikeImagePathname(url.pathname) || url.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function getRenderableCoverImage(value: string) {
  return isRenderableCoverImage(value) ? value : DEFAULT_COVER_IMAGE;
}
