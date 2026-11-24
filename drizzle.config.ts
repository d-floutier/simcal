import { defineConfig } from "drizzle-kit";

// Used by `pnpm db:generate` (no database needed). Migrations are applied by
// scripts/migrate.ts, which targets Neon (DATABASE_URL) or the local PGlite folder.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
