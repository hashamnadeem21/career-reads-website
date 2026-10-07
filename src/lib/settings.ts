import { adsSettingsSchema, siteSettingsSchema, type AdsSettings, type SiteSettings } from "./settings-schema";

/**
 * Settings edited in the admin panel. Empty until `ensureSiteData()` loads them
 * from the database; every reader falls back to environment variables.
 */
const runtime: { ads?: AdsSettings; site?: SiteSettings } = {};

export function runtimeSettings(): Readonly<typeof runtime> {
  return runtime;
}

/** Applies stored rows; invalid or missing values are ignored (env fallback stays). */
export function applySettings(rows: { key: string; value: unknown }[]): void {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const ads = adsSettingsSchema.safeParse(byKey.get("ads"));
  const site = siteSettingsSchema.safeParse(byKey.get("site"));
  runtime.ads = ads.success ? ads.data : undefined;
  runtime.site = site.success ? site.data : undefined;
}
