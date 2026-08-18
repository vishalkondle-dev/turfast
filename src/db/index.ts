import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

/**
 * Dual-driver database accessor.
 * - Local dev / Node (next dev, seed scripts): libSQL against a local file.
 * - Cloudflare Workers runtime: D1 binding (env.DB).
 * Both expose the same Drizzle API over the identical SQLite schema.
 */

export type DB = ReturnType<typeof drizzleLibsql<typeof schema>> | ReturnType<typeof drizzleD1<typeof schema>>;

let _local: DB | null = null;

function localDb(): DB {
  if (!_local) {
    const client = createClient({ url: process.env.LOCAL_DB_URL || "file:./local.db" });
    _local = drizzleLibsql(client, { schema });
  }
  return _local;
}

/**
 * Returns a Drizzle instance. On Cloudflare, pass the D1 binding via `d1`.
 * In Node dev, omit it and the libSQL file driver is used.
 */
export function getDb(d1?: D1Database): DB {
  if (d1) return drizzleD1(d1, { schema });
  return localDb();
}

export { schema };
export * from "./schema";
