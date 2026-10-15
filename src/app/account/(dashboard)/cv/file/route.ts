import { apiPath } from "@/lib/api/client";
import { candidateCvResponse } from "@/lib/candidate/cv-download";

/** GET /account/cv/file: the CV saved on their account (PDFs open in the browser; `?download=true` saves). */
export async function GET(request: Request) {
  return candidateCvResponse(request, apiPath("/public/candidate/cv"), "/account/cv/file");
}
