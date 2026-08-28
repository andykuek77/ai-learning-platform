import { createClient } from "@supabase/supabase-js";

export function createContentAdminClient(rawUrl: string, rawServiceRoleKey: string) {
  const url = normalizeProjectUrl(rawUrl);
  const serviceRoleKey = normalizeServiceRoleKey(rawServiceRoleKey);
  const nativeFetch = globalThis.fetch.bind(globalThis);

  const diagnosticFetch: typeof fetch = async (input, init) => {
    try {
      return await nativeFetch(input, init);
    } catch (error) {
      throw new Error(
        `Supabase transport request failed (${describeCause(error, [url, serviceRoleKey])})`,
        { cause: error }
      );
    }
  };

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: diagnosticFetch },
  });
}

export function normalizeProjectUrl(rawUrl: string) {
  const value = stripMatchingQuotes(rawUrl.trim());
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid absolute URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use http or https");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must not contain credentials, query parameters, or a fragment");
  }
  if (parsed.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be the project base URL, without /rest/v1 or another path");
  }
  return parsed.origin;
}

function normalizeServiceRoleKey(rawKey: string) {
  const trimmed = rawKey.trim();
  const value = stripMatchingQuotes(trimmed);
  if (!value) throw new Error("SUPABASE_SERVICE_ROLE_KEY is empty");
  if (value !== trimmed) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must not include surrounding quotes");
  }
  if (/\s/.test(value)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY contains whitespace or a line break");
  }
  return value;
}

function stripMatchingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function describeCause(error: unknown, secrets: string[]) {
  const details: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (!(current instanceof Error)) break;
    const cause = current as Error & {
      cause?: unknown;
      code?: unknown;
      errno?: unknown;
      syscall?: unknown;
    };
    const values = [
      typeof cause.code === "string" ? `code=${cause.code}` : null,
      typeof cause.errno === "number" || typeof cause.errno === "string" ? `errno=${cause.errno}` : null,
      typeof cause.syscall === "string" ? `syscall=${cause.syscall}` : null,
      cause.message ? `message=${sanitize(cause.message, secrets)}` : null,
    ].filter(Boolean);
    if (values.length > 0) details.push(values.join(", "));
    current = cause.cause;
  }
  return details.join("; caused by ") || "no safe cause details available";
}

function sanitize(value: string, secrets: string[]) {
  let sanitized = value;
  for (const secret of secrets) {
    if (secret) sanitized = sanitized.split(secret).join("[redacted]");
  }
  return sanitized
    .replace(/Bearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]")
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted-key]");
}
