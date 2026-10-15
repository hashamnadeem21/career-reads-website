import "server-only";
import { ApiRequestError, apiFile, hasApi } from "@/lib/api/client";
import { sessionToken } from "./session";

/** Relative, so it stays on the address the visitor used (behind a proxy, request.url can be internal). */
const toSignIn = (here: string) =>
  new Response(null, { status: 303, headers: { Location: `/account/sign-in?mode=signin&next=${encodeURIComponent(here)}`, "Cache-Control": "private, no-store" } });

const PASS_ON = ["content-type", "content-length", "content-disposition", "x-content-type-options"];

/**
 * Streams one of the signed-in candidate's own CVs from the API. Signed out: back to sign-in,
 * then here again. The API checks the CV is theirs; anyone else's is a 404.
 */
export async function candidateCvResponse(request: Request, apiPathname: string, here: string): Promise<Response> {
  const token = hasApi() ? await sessionToken() : null;
  if (!token) return toSignIn(here);
  const download = new URL(request.url).searchParams.get("download") === "true" ? "true" : undefined;
  try {
    const file = await apiFile(apiPathname, { candidateSession: token, query: { download } });
    if (!file) return new Response("This CV is no longer available.", { status: 404, headers: { "Cache-Control": "private, no-store" } });
    const headers = new Headers({ "Cache-Control": "private, no-store" });
    for (const name of PASS_ON) {
      const value = file.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(file.body, { status: 200, headers });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return toSignIn(here);
    }
    console.error("[account] couldn't load a CV", error);
    return new Response("We couldn't open your CV. Please try again in a minute.", { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
