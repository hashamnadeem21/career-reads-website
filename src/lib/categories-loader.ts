import "server-only";
import { unstable_cache } from "next/cache";
import { apiGet, apiPath, hasApi } from "@/lib/api/client";
import { replaceCategories } from "@/lib/categories";
import { replaceJobCategories } from "@/lib/jobs/categories";

interface CategoryRow {
  slug: string;
  kind: "blog" | "job";
  name: string;
  headline: string | null;
  description: string;
  accent: string | null;
}

const loadCategoryRows = unstable_cache(
  async () => (await apiGet<CategoryRow[]>(apiPath("/public/categories"))) ?? [],
  ["api-categories"],
  { tags: ["categories"], revalidate: 3600 },
);

/**
 * Loads categories from the API (when configured) into the in-memory
 * category lists. Call it before reading `categories` / `jobCategories`.
 * Without the API, or if it fails, the built-in typed lists stay active.
 */
export async function ensureCategories(): Promise<void> {
  if (!hasApi()) return;
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
    console.error("Could not load categories from the API; using the built-in lists.", error);
  }
}
