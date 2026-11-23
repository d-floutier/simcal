import { readFileSync } from "node:fs";
import { and, desc, eq, sql } from "drizzle-orm";
import { normaliserRecherche, type ValeursNutritionnelles } from "@/core";
import type { Db } from "@/db/client";
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

/** La requête plein texte : chaque mot, au début d'un mot du nom (« pom » trouve « pomme »). */
export function requetePleinTexte(texte: string): string | null {
  const mots = normaliserRecherche(texte).split(" ").filter(Boolean);
  return mots.length === 0 ? null : mots.map((m) => `${m}:*`).join(" & ");
}

export const LIMITE_RESULTATS = 30;

/** La source CIQUAL : les Aliments génériques importés dans la base. */
export function sourceCiqual(db: Db): SourceAliments {
  return {
    async chercher(texte) {
      const requete = requetePleinTexte(texte);
      if (!requete) return [];
      const tsquery = sql`to_tsquery('french', ${requete})`;
      const vecteur = sql`to_tsvector('french', ${aliment.nomRecherche})`;
      const debut = normaliserRecherche(texte);
      const lignes: AlimentResume[] = await db
        .select({
          id: aliment.id,
          type: aliment.type,
          nom: aliment.nom,
          marque: aliment.marque,
          kcal: aliment.kcal,
          unite: aliment.unite,
        })
        .from(aliment)
        .where(and(eq(aliment.type, "generique"), sql`${vecteur} @@ ${tsquery}`))
        .orderBy(
          desc(sql`${aliment.nomRecherche} like ${debut + "%"}`),
          desc(sql`ts_rank(${vecteur}, ${tsquery})`),
          sql`length(${aliment.nom})`,
          aliment.nom,
        )
        .limit(LIMITE_RESULTATS);
      return lignes;
    },
    // Les Aliments génériques n'ont pas de Code-barres.
    async trouverParCodeBarres() {
      return null;
    },
  };
}
