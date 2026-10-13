import { z } from "zod";
import { ApiRequestError, apiPath, apiPost, hasApi } from "@/lib/api/client";
import { rateLimit } from "@/lib/forms/rate-limit";

/**
 * POST /api/presence  { id: <random per-tab uuid>, leave?: true }
 *
 * Heartbeats from open tabs, for the admin's "Online now" count. The id is made up by the tab
 * and kept in memory only: no cookies, nothing personal. The visitor's IP and user agent are
 * passed along for rate limiting and bot filtering only.
 */
const bodySchema = z.object({ id: z.uuid(), leave: z.boolean().optional() }).strict();

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|lighthouse|pingdom|uptime/i;

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  if (!hasApi()) return noContent();

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_PATTERN.test(ua)) return noContent();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (!rateLimit(`presence:${ip ?? "unknown"}`, 60, 60_000).allowed) return new Response(null, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    await apiPost(apiPath("/public/presence"), body, { ip, userAgent: ua });
  } catch (error) {
    if (error instanceof ApiRequestError && [400, 429].includes(error.status)) {
      return new Response(null, { status: error.status });
    }
    console.error("[presence] Could not record the heartbeat through the API", error);
    return new Response(null, { status: 502 });
  }
  return noContent();
}
