// Dérive data/ciqual-2025.csv (compact, versionné) de la table Ciqual officielle.
//
//   pnpm tsx scripts/ciqual/deriver.ts <table-ciqual.csv> [data/ciqual-2025.csv]
//
// Entrée : la 1re feuille de « Table Ciqual 2025_FR_2025_11_03.xlsx » (Anses, Licence Ouverte 2.0,
// https://doi.org/10.57745/RDMHWY) exportée en CSV séparé par des virgules, en UTF-8
// (par exemple `soffice --headless --convert-to csv`). Voir le README.
//
// Conventions Ciqual : « - » = valeur inconnue (vide en sortie), « traces » et « < x »
// (sous la limite de quantification) = 0. Les aliments sans kcal ou sans l'une des trois Macros
// sont écartés : on ne peut pas les noter de façon fiable.
import { readFileSync, writeFileSync } from "node:fs";
import { ecrireCsv, lireCsv } from "../../src/sources/csv";

const COLONNES = {
  code: "alim_code",
  nom: "alim_nom_fr",
  kcal: "Energie, Règlement UE N° 1169 2011 (kcal 100 g)",
  proteines: "Protéines, N x facteur de Jones (g 100 g)",
  glucides: "Glucides (g 100 g)",
  lipides: "Lipides (g 100 g)",
  sucres: "Sucres (g 100 g)",
  fibres: "Fibres alimentaires (g 100 g)",
  satures: "AG saturés (g 100 g)",
  sel: "Sel chlorure de sodium (g 100 g)",
} as const;

const OBLIGATOIRES = ["kcal", "proteines", "glucides", "lipides"] as const;

const normaliser = (t: string) => t.replace(/\s+/g, " ").trim();

function valeur(brut: string): number | null {
  const t = normaliser(brut).toLowerCase();
  if (t === "" || t === "-") return null;
  if (t === "traces" || t.startsWith("<")) return 0;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Valeur Ciqual illisible : « ${brut} »`);
  return n;
}

const [entree, sortie = "data/ciqual-2025.csv"] = process.argv.slice(2);
if (!entree) {
  console.error("Usage : tsx scripts/ciqual/deriver.ts <table-ciqual.csv> [sortie.csv]");
  process.exit(1);
}

const [entete, ...lignes] = lireCsv(readFileSync(entree, "utf8"));
const index = Object.fromEntries(
  Object.entries(COLONNES).map(([cle, titre]) => {
    const i = entete.findIndex((h) => normaliser(h) === titre);
    if (i < 0) throw new Error(`Colonne introuvable : ${titre}`);
    return [cle, i];
  }),
) as Record<keyof typeof COLONNES, number>;

const nutriments = ["kcal", "proteines", "glucides", "lipides", "sucres", "fibres", "satures", "sel"] as const;
const sorties: (string | number | null)[][] = [["code", "nom", ...nutriments]];
let ecartes = 0;
for (const l of lignes) {
  if (l.length < entete.length / 2) continue;
  const valeurs = nutriments.map((n) => valeur(l[index[n]]));
  if (OBLIGATOIRES.some((n) => valeurs[nutriments.indexOf(n)] === null)) {
    ecartes++;
    continue;
  }
  sorties.push([normaliser(l[index.code]), normaliser(l[index.nom]), ...valeurs]);
}
writeFileSync(sortie, ecrireCsv(sorties));
console.log(`${sorties.length - 1} aliments écrits dans ${sortie} (${ecartes} écartés).`);
