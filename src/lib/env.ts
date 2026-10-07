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
  /** Postgres shared with the admin panel. Without it, content is read from `content/`. */
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().regex(/^postgres(ql)?:\/\//).optional()),
  /** Shared secret the admin panel sends to /api/revalidate. */
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
