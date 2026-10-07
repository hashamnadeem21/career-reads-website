import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { serverEnv } from "@/lib/env";

/**
 * Called by the admin panel after every save:
 *   POST /api/revalidate  Authorization: Bearer <REVALIDATE_SECRET>
 *   { "tags": ["jobs"], "paths": ["/", "/jobs", "/jobs/frontend-developer"] }
 */
const bodySchema = z
  .object({
    tags: z.array(z.enum(CACHE_TAGS)).max(10).default([]),
    paths: z
      .array(z.string().regex(/^\/[A-Za-z0-9\-._~/[\]]*$/, "paths must be site-relative"))
      .max(50)
      .default([]),
  })
  .strict();

function secretMatches(header: string | null, secret: string): boolean {
  const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = serverEnv().REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: "Revalidation is not configured" }, { status: 503 });
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  // expire: 0 so the very next visit gets fresh content (no stale-while-revalidate window).
  for (const tag of body.tags) revalidateTag(tag, { expire: 0 });
  for (const path of body.paths) revalidatePath(path);

  return Response.json({ revalidated: true, tags: body.tags, paths: body.paths, now: Date.now() });
}
