import "server-only";
import { serverEnv } from "@/lib/env";
import type { paths } from "./schema";

/**
 * Server-only client for the Career Reads API (blognest-api). Paths are checked against the
 * generated OpenAPI types (`npm run api:types`). Every call carries the site's server key, and
 * form/stats calls pass the visitor's IP (and user agent) so the API can rate-limit per visitor.
 */
type ApiPath = keyof paths;

/** Fills `{slug}`-style segments: `apiPath("/public/jobs/{slug}", { slug })`. */
export function apiPath<P extends ApiPath>(path: P, params: Record<string, string> = {}): string {
  return path.replace(/\{(\w+)\}/g, (_, name: string) => encodeURIComponent(params[name] ?? ""));
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** True when API_URL is set. Without it, the site reads the files in `content/`. */
export const hasApi = (): boolean => Boolean(serverEnv().API_URL);

interface CallOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | undefined>;
  body?: unknown;
  /** The visitor's address and browser, for the API's per-visitor limits and bot filter. */
  visitor?: { ip?: string | null; userAgent?: string | null };
}

async function call(path: string, { method = "GET", query, body, visitor }: CallOptions): Promise<Response> {
  const { API_URL, SITE_API_KEY } = serverEnv();
  if (!API_URL) throw new Error("API_URL is not set");
  const url = new URL(path, `${API_URL}/`);
  for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) url.searchParams.set(key, value);

  const headers: Record<string, string> = { accept: "application/json" };
  if (SITE_API_KEY) headers["x-api-key"] = SITE_API_KEY;
  if (visitor?.ip) headers["x-client-ip"] = visitor.ip;
  if (visitor?.userAgent) headers["x-client-user-agent"] = visitor.userAgent;
  if (body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    // Reads are cached by the callers (unstable_cache + tags), never by fetch itself.
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiRequestError(
      response.status,
      error?.error?.code ?? "error",
      error?.error?.message ?? `API answered ${response.status} for ${method} ${url.pathname}`,
    );
  }
  return response;
}

/** GET a JSON resource. Returns null for a 404 so callers can show their own not-found page. */
export async function apiGet<T>(path: string, query?: CallOptions["query"]): Promise<T | null> {
  try {
    return (await (await call(path, { query })).json()) as T;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** POST JSON. Resolves when the API accepted it; throws ApiRequestError otherwise. */
export async function apiPost(path: string, body: unknown, visitor?: CallOptions["visitor"]): Promise<void> {
  await call(path, { method: "POST", body, visitor });
}
