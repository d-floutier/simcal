// Applies the Drizzle migrations in ./drizzle to Neon (DATABASE_URL) or, without it,
// to the local PGlite folder (PGLITE_DIR, default ./.pglite).
// Run it before `next dev`/`next start`: PGlite allows only one process per folder.
import { connect } from "../src/db/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (process.env.VERCEL && !databaseUrl) {
    // Preview deployments have no database: say so rather than migrate a throwaway PGlite.
    console.log("No DATABASE_URL on Vercel: migrations skipped.");
    return;
  }
  const pgliteDir = process.env.PGLITE_DIR ?? "./.pglite";
  const conn = connect({ databaseUrl, pgliteDir });
  await conn.migrate();
  console.log(`Migrations applied (${conn.driver === "neon" ? "Neon" : `PGlite ${pgliteDir}`}).`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
