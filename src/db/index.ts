import "server-only";
import { connect, type Db } from "./client";

const globalForDb = globalThis as unknown as { simcalDb?: Db };

/**
 * The app's database, opened lazily (so `next build` never opens it) and kept on
 * globalThis so dev hot reloads reuse the single PGlite instance.
 * Migrations are applied beforehand by `pnpm db:migrate`, never at request time.
 */
export function getDb(): Db {
  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required on Vercel (PGlite is for local dev only).");
  }
  globalForDb.simcalDb ??= connect({
    databaseUrl: process.env.DATABASE_URL,
    pgliteDir: process.env.PGLITE_DIR ?? "./.pglite",
  }).db;
  return globalForDb.simcalDb;
}
