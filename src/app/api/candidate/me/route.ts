import { hasApi } from "@/lib/api/client";
import { currentCandidate } from "@/lib/candidate/session";

/**
 * GET /api/candidate/me → { enabled, candidate } (null when signed out; enabled is false without an API). The header's account menu reads
 * this in the browser, so pages themselves stay static and cacheable.
 */
export async function GET() {
  const candidate = await currentCandidate();
  return Response.json(
    {
      enabled: hasApi(),
      candidate: candidate && {
        name: candidate.name,
        email: candidate.email,
        avatarUrl: candidate.avatarUrl,
        emailVerified: candidate.emailVerified,
        subscribed: candidate.subscribed,
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
