/** Cache tags. The API revalidates these through /api/revalidate after every save. */
export const CACHE_TAGS = ["articles", "authors", "jobs", "categories", "settings"] as const;
export type CacheTag = (typeof CACHE_TAGS)[number];
