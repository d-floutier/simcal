import { readFileSync } from "node:fs";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { normaliserRecherche, type ValeursNutritionnelles } from "@/core";
import type { Db } from "@/db/client";
import { recherchePleinTexte } from "@/db/plein-texte";
import { aliment } from "@/db/schema";
import { lireCsv } from "./csv";
import type { AlimentResume, SourceAliments } from "./source";

/** Un Aliment générique tel que fourni par CIQUAL (valeurs pour 100 g). */
export type AlimentGenerique = { code: string; nom: string } & ValeursNutritionnelles;

const NUTRIMENTS = ["kcal", "proteines", "glucides", "lipides", "sucres", "fibres", "satures", "sel"] as const;

/** Lit le fichier compact versionné dans le repo (data/ciqual-2025.csv, voir scripts/ciqual). */
export function lireFichierCiqual(chemin: string): AlimentGenerique[] {
  const [entete, ...lignes] = lireCsv(readFileSync(chemin, "utf8"));
  const col = (nom: string) => {
    const i = entete.indexOf(nom);
    if (i < 0) throw new Error(`Colonne ${nom} absente de ${chemin}`);
    return i;
  };
  const iCode = col("code");
  const iNom = col("nom");
  const iNutriments = NUTRIMENTS.map(col);
  return lignes
    .filter((l) => l.length === entete.length)
    .map((l) => {
      const valeurs = Object.fromEntries(
        NUTRIMENTS.map((n, k) => [n, l[iNutriments[k]] === "" ? null : Number(l[iNutriments[k]])]),
      ) as ValeursNutritionnelles;
      return { code: l[iCode], nom: l[iNom], ...valeurs };
    });
}

/**
 * Importe (ou met à jour) les Aliments génériques, identifiés par leur code CIQUAL : relancer
 * l'import ne crée pas de doublon et garde les identifiants, donc les liens des Entrées.
 */
export async function importerAlimentsGeneriques(db: Db, aliments: AlimentGenerique[]): Promise<number> {
  const PAQUET = 500;
  for (let i = 0; i < aliments.length; i += PAQUET) {
    const lignes = aliments.slice(i, i + PAQUET).map(({ code, ...a }) => ({
      ...a,
      type: "generique" as const,
      codeSource: code,
      nomRecherche: normaliserRecherche(a.nom),
      unite: "g" as const,
    }));
    await db
      .insert(aliment)
      .values(lignes)
      .onConflictDoUpdate({
        target: [aliment.type, aliment.codeSource],
        set: {
          nom: sql`excluded.nom`,
          nomRecherche: sql`excluded.nom_recherche`,
          ...Object.fromEntries(NUTRIMENTS.map((n) => [n, sql.raw(`excluded.${n}`)])),
          misAJour: sql`now()`,
        },
      });
  }
  return aliments.length;
}

export const LIMITE_RESULTATS = 30;

/**
 * Cherche en plein texte parmi les Aliments gardés en base qui vérifient `filtre` : d'abord les
 * noms qui commencent par la recherche, puis par pertinence, puis les noms les plus courts.
 */
export async function chercherEnBase(db: Db, texte: string, filtre: SQL | undefined): Promise<AlimentResume[]> {
  const recherche = recherchePleinTexte(texte);
  if (!recherche) return [];
  const debut = normaliserRecherche(texte);
  return db
    .select({
      id: aliment.id,
      type: aliment.type,
      nom: aliment.nom,
      marque: aliment.marque,
      kcal: aliment.kcal,
      unite: aliment.unite,
    })
    .from(aliment)
    .where(and(filtre, recherche.correspond))
    .orderBy(
      desc(sql`${aliment.nomRecherche} like ${debut + "%"}`),
      desc(recherche.pertinence),
      sql`length(${aliment.nom})`,
      aliment.nom,
    )
    .limit(LIMITE_RESULTATS);
}

/** La source CIQUAL : les Aliments génériques importés dans la base. */
export function sourceCiqual(db: Db): SourceAliments {
  return {
    chercher: (texte) => chercherEnBase(db, texte, eq(aliment.type, "generique")),
    // Les Aliments génériques n'ont pas de Code-barres.
    async trouverParCodeBarres() {
      return null;
    },
  };
}
