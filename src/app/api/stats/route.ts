import { z } from "zod";
import { ApiRequestError, apiPath, apiPost, hasApi } from "@/lib/api/client";
import { rateLimit } from "@/lib/forms/rate-limit";

/**
 * POST /api/stats  { path: "/blog/<slug>" | "/jobs/<slug>", kind: "view" | "apply_click" }
 *
 * Forwards the hit to the API, which adds 1 to today's counter for that page. Only counts
 * per page per day are stored: no cookies, no IP addresses, no user agents, no personal data.
 * The visitor's IP and user agent are passed along for rate limiting and bot filtering only.
 */
const bodySchema = z
  .object({
    path: z.string().regex(/^\/(blog|jobs)\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(["view", "apply_click"]),
  })
  .strict();

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|lighthouse|pingdom|uptime/i;

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  if (!hasApi()) return noContent();

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_PATTERN.test(ua)) return noContent();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  if (!rateLimit(`stats:${ip ?? "unknown"}`, 120, 60_000).allowed) return new Response(null, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    await apiPost(apiPath("/public/stats"), body, { ip, userAgent: ua });
  } catch (error) {
    if (error instanceof ApiRequestError && [400, 404, 429].includes(error.status)) {
      return new Response(null, { status: error.status });
    }
    console.error("[stats] Could not record the hit through the API", error);
    return new Response(null, { status: 502 });
  }
  return noContent();
}
