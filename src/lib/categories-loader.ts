import "server-only";
import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { categories as categoriesTable } from "@/db/schema";
import { replaceCategories } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { replaceJobCategories } from "@/lib/jobs/categories";

const loadCategoryRows = unstable_cache(
  async () => {
    const db = getDb();
    if (!db) return [];
    return db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  },
  ["db-categories"],
  { tags: ["categories"], revalidate: 3600 },
);

/**
 * Loads categories from the database (when configured) into the in-memory
 * category lists. Call it before reading `categories` / `jobCategories`.
 * Without a database, or if it fails, the built-in typed lists stay active.
 */
export async function ensureCategories(): Promise<void> {
  if (!getDb()) return;
  try {
    const rows = await loadCategoryRows();
    replaceCategories(
      rows
        .filter((r) => r.kind === "blog")
        .map((r) => ({
          slug: r.slug,
          name: r.name,
          headline: r.headline ?? r.name,
          description: r.description,
          accent: r.accent,
        })),
    );
    replaceJobCategories(
      rows.filter((r) => r.kind === "job").map((r) => ({ slug: r.slug, name: r.name, description: r.description })),
    );
  } catch (error) {
    console.error("Could not load categories from the database; using the built-in lists.", error);
  }
}
