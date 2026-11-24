import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import path from "node:path";
import * as schema from "./schema";

/** The database handle every service receives. Neon and PGlite both satisfy it. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

type Connection =
  | { driver: "neon"; db: Db; migrate: () => Promise<void> }
  | { driver: "pglite"; db: Db; migrate: () => Promise<void> };

/**
 * Neon serverless (WebSocket pool, supports transactions) when a URL is given,
 * otherwise PGlite: a folder for local dev, or in memory when `dataDir` is omitted.
 */
export function connect(opts: { databaseUrl?: string; pgliteDir?: string }): Connection {
  if (opts.databaseUrl) {
    const db = drizzleNeon({ connection: opts.databaseUrl, schema });
    return {
      driver: "neon",
      db: db as unknown as Db,
      migrate: () => migrateNeon(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    };
  }
  const db = drizzlePglite({ client: new PGlite(opts.pgliteDir ?? "memory://"), schema });
  return {
    driver: "pglite",
    db: db as unknown as Db,
    migrate: () => migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER }),
  };
}
