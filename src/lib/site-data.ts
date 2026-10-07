import "server-only";
import { unstable_cache } from "next/cache";
import { settings as settingsTable } from "@/db/schema";
import { ensureCategories } from "@/lib/categories-loader";
import { getDb } from "@/lib/db";
import { applySettings } from "@/lib/settings";

const loadSettingsRows = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return [];
    return db.select().from(settingsTable);
  },
  ["db-settings"],
  { tags: ["settings"], revalidate: 3600 },
);

export async function ensureSettings(): Promise<void> {
  if (!getDb()) return;
  try {
    applySettings(await loadSettingsRows());
  } catch (error) {
    console.error("Could not load settings from the database; using environment variables.", error);
  }
}

/**
 * Loads everything the admin panel manages that pages read synchronously
 * (categories, ads and site settings). Call before rendering. No-op without a database.
 */
export async function ensureSiteData(): Promise<void> {
  await Promise.all([ensureCategories(), ensureSettings()]);
}
