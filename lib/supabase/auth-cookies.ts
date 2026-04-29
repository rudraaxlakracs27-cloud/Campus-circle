type CookieLike = {
  name: string;
};

export function hasSupabaseAuthCookies(cookies: CookieLike[]) {
  return cookies.some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}
