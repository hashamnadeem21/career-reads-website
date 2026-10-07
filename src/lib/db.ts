import "server-only";
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNodePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import ws from "ws";
import * as schema from "@/db/schema";
import { serverEnv } from "@/lib/env";

/**
 * Database client, or null when DATABASE_URL is not set (the site then reads
 * the files in `content/`). The admin panel (blognest-admin) owns the schema.
 */
export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __blognestDb?: { url: string; db: Database } };

export function getDb(): Database | null {
  const url = serverEnv().DATABASE_URL;
  if (!url) return null;
  if (globalForDb.__blognestDb?.url === url) return globalForDb.__blognestDb.db;

  let db: Database;
  if (/\.neon\.tech[:/]/.test(url)) {
    neonConfig.webSocketConstructor = ws;
    db = drizzleNeon(new NeonPool({ connectionString: url }), { schema }) as unknown as Database;
  } else {
    db = drizzleNodePg(new Pool({ connectionString: url, max: 5 }), { schema });
  }
  globalForDb.__blognestDb = { url, db };
  return db;
}

export const hasDatabase = (): boolean => Boolean(serverEnv().DATABASE_URL);

/** Cache tags. The admin panel revalidates these through /api/revalidate. */
export const CACHE_TAGS = ["articles", "authors", "jobs", "categories", "settings"] as const;
export type CacheTag = (typeof CACHE_TAGS)[number];
