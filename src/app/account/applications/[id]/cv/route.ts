import type { NextRequest } from "next/server";
import { apiPath } from "@/lib/api/client";
import { candidateCvResponse } from "@/lib/candidate/cv-download";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /account/applications/{id}/cv: the CV they sent with that application. */
export async function GET(request: NextRequest, ctx: RouteContext<"/account/applications/[id]/cv">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  return candidateCvResponse(request, apiPath("/public/candidate/applications/{id}/cv", { id }), `/account/applications/${id}/cv`);
}
