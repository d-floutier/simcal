import { and, desc, eq, isNotNull } from "drizzle-orm";
import { recherchePleinTexte } from "@/db/plein-texte";
import { aliment, entree } from "@/db/schema";
import type { AlimentResume } from "@/sources/source";
import type { Contexte } from "./contexte";
import { versEntree, type QuantiteEntree } from "./journal";

/** Un Récent : un Aliment noté récemment, avec la quantité de sa dernière Entrée. */
export type Recent = { aliment: AlimentResume; quantite: QuantiteEntree };

export const NOMBRE_RECENTS = 20;

/**
 * Les Récents : les 20 derniers Aliments distincts notés, du plus récemment noté au plus ancien,
 * chacun avec la quantité de sa dernière Entrée, telle qu'elle a été saisie. Un Aliment supprimé
 * n'en fait plus partie. Avec `texte`, seuls ceux de ces 20 Récents qui correspondent à la recherche.
 */
export async function lireRecents(ctx: Contexte, texte?: string): Promise<Recent[]> {
  const recherche = texte === undefined ? null : recherchePleinTexte(texte);
  if (texte !== undefined && !recherche) return [];

  const derniere = ctx.db
    .selectDistinctOn([entree.alimentId])
    .from(entree)
    .where(and(eq(entree.userId, ctx.userId), isNotNull(entree.alimentId)))
    .orderBy(entree.alimentId, desc(entree.creeLe), desc(entree.id))
    .as("derniere");

  // Les 20 Récents d'abord, le texte ne filtre que parmi eux.
  const recents = ctx.db
    .select()
    .from(derniere)
    .orderBy(desc(derniere.creeLe), desc(derniere.id))
    .limit(NOMBRE_RECENTS)
    .as("recents");

  const lignes = await ctx.db
    .select({ entree: recents._.selectedFields, aliment })
    .from(recents)
    .innerJoin(aliment, eq(aliment.id, recents.alimentId))
    .where(recherche?.correspond)
    .orderBy(desc(recents.creeLe), desc(recents.id));

  return lignes.map(({ entree: e, aliment: a }) => ({
    aliment: { id: a.id, type: a.type, nom: a.nom, marque: a.marque, kcal: a.kcal, unite: a.unite },
    quantite: versEntree(e).quantite,
  }));
}
