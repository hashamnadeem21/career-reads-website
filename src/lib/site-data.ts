import "server-only";
import { unstable_cache } from "next/cache";
import { apiGet, apiPath, hasApi } from "@/lib/api/client";
import { ensureCategories } from "@/lib/categories-loader";
import { applySettings } from "@/lib/settings";

const loadSettings = unstable_cache(
  async () => (await apiGet<{ ads: unknown; site: unknown }>(apiPath("/public/settings"))) ?? { ads: null, site: null },
  ["api-settings"],
  { tags: ["settings"], revalidate: 3600 },
);

export async function ensureSettings(): Promise<void> {
  if (!hasApi()) return;
  try {
    const { ads, site } = await loadSettings();
    applySettings([
      { key: "ads", value: ads },
      { key: "site", value: site },
    ]);
  } catch (error) {
    console.error("Could not load settings from the API; using environment variables.", error);
  }
}

/**
 * Loads everything the admin panel manages that pages read synchronously
 * (categories, ads and site settings). Call before rendering. No-op without the API.
 */
export async function ensureSiteData(): Promise<void> {
  await Promise.all([ensureCategories(), ensureSettings()]);
}
