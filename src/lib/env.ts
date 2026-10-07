import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * `NEXT_PUBLIC_*` variables must be referenced literally (process.env.NEXT_PUBLIC_X)
 * so Next.js can inline them into the client bundle at build time.
 * Server-only secrets live in `serverEnv()` and must never be imported by a
 * Client Component.
 */

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());
const booleanFlag = z.preprocess(
  emptyToUndefined,
  z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
);

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^G-[A-Z0-9]+$/, "GA4 measurement IDs look like G-XXXXXXXXXX")
      .optional(),
  ),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^ca-pub-\d{10,20}$/, "AdSense client IDs look like ca-pub-0000000000000000")
      .optional(),
  ),
  NEXT_PUBLIC_ADS_ENABLED: booleanFlag,
  NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS: booleanFlag,
  NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE: optionalString,
  NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: optionalString,
  NEXT_PUBLIC_ADSENSE_SLOT_BELOW_ARTICLE: optionalString,
  NEXT_PUBLIC_ADSENSE_SLOT_LISTING: optionalString,
  NEXT_PUBLIC_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.email().default("hello@example.com"),
  ),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED,
  NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS: process.env.NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS,
  NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  NEXT_PUBLIC_ADSENSE_SLOT_BELOW_ARTICLE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BELOW_ARTICLE,
  NEXT_PUBLIC_ADSENSE_SLOT_LISTING: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
});

if (!parsedPublic.success) {
  throw new Error(
    `Invalid public environment configuration:\n${z.prettifyError(parsedPublic.error)}`,
  );
}

export const publicEnv = {
  ...parsedPublic.data,
  NEXT_PUBLIC_SITE_URL: parsedPublic.data.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, ""),
};

/** Where the live site reads its content when API_URL isn't set on a production deployment. */
export const PRODUCTION_API_URL = "https://api.careersreads.com";

export const isProduction = process.env.NODE_ENV === "production";

const serverSchema = z.object({
  GOOGLE_SITE_VERIFICATION: optionalString,
  BING_SITE_VERIFICATION: optionalString,
  CONTENT_PREVIEW_DRAFTS: booleanFlag,
  RESEND_API_KEY: optionalString,
  CONTACT_TO_EMAIL: z.preprocess(emptyToUndefined, z.email().optional()),
  CONTACT_FROM_EMAIL: optionalString,
  NEWSLETTER_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  NEWSLETTER_WEBHOOK_SECRET: optionalString,
  /**
   * The Career Reads API (blognest-api), e.g. http://localhost:4000. Without it, content is read
   * from `content/`, except on Vercel production deployments, which default to PRODUCTION_API_URL.
   */
  API_URL: z.preprocess(
    (v) => emptyToUndefined(v) ?? (process.env.VERCEL_ENV === "production" ? PRODUCTION_API_URL : undefined),
    z
      .url()
      .optional()
      .transform((v) => v?.replace(/\/+$/, "")),
  ),
  /** Sent to the API as X-Api-Key (form submissions, stats, draft previews). Same value as SITE_API_KEY there. */
  SITE_API_KEY: optionalString,
  /** Shared secret the API sends to /api/revalidate after saves. */
  REVALIDATE_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Server-only configuration. Reads lazily so tests can override process.env. */
export function serverEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

/** Drafts are only ever rendered in local development with an explicit opt-in. */
export function canPreviewDrafts(): boolean {
  return !isProduction && serverEnv().CONTENT_PREVIEW_DRAFTS === true;
}
