// Importe les Aliments génériques CIQUAL 2025 (data/ciqual-2025.csv, versionné) dans Neon
// (DATABASE_URL) ou, sans elle, dans le dossier PGlite local (PGLITE_DIR, défaut ./.pglite).
// Répétable : chaque Aliment est identifié par son code CIQUAL et mis à jour sur place.
// Appliquer les migrations d'abord (pnpm db:migrate).
import path from "node:path";
import { connect } from "../src/db/client";
import { importerAlimentsGeneriques, lireFichierCiqual } from "../src/sources/ciqual";

async function main() {
  const fichier = process.argv[2] ?? path.join(process.cwd(), "data/ciqual-2025.csv");
  const conn = connect({ databaseUrl: process.env.DATABASE_URL, pgliteDir: process.env.PGLITE_DIR ?? "./.pglite" });
  const n = await importerAlimentsGeneriques(conn.db, lireFichierCiqual(fichier));
  console.log(`${n} Aliments génériques CIQUAL importés (${conn.driver === "neon" ? "Neon" : "PGlite"}).`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
