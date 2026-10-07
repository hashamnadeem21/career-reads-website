import { sql } from "drizzle-orm";
import { z } from "zod";
import { getArticleBySlug } from "@/lib/content";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/forms/rate-limit";
import { getJobBySlug } from "@/lib/jobs";

/**
 * POST /api/stats  { path: "/blog/<slug>" | "/jobs/<slug>", kind: "view" | "apply_click" }
 *
 * Adds 1 to today's counter for that page. Stores counts per page per day only:
 * no cookies, no IP addresses, no user agents, no personal data. The in-memory
 * rate limit key uses the IP but is never written anywhere.
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
  const db = getDb();
  if (!db) return noContent();

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_PATTERN.test(ua)) return noContent();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`stats:${ip}`, 120, 60_000).allowed) return new Response(null, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return new Response(null, { status: 400 });
  }

  const [section, slug] = body.path.slice(1).split("/");
  if (body.kind === "apply_click" && section !== "jobs") return new Response(null, { status: 400 });

  // Only count pages that really exist and are public, so junk paths never reach the table.
  const exists = section === "blog" ? await getArticleBySlug(slug) : await getJobBySlug(slug);
  if (!exists) return new Response(null, { status: 404 });

  await db.execute(sql`
    insert into daily_stats (day, path, kind, entity_slug, count)
    values ((now() at time zone 'utc')::date, ${body.path}, ${body.kind}, ${slug}, 1)
    on conflict (day, path, kind) do update set count = daily_stats.count + 1
  `);
  return noContent();
}
