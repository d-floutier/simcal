import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { aliment, entree } from "@/db/schema";
import { requetePleinTexte } from "@/sources/ciqual";
import type { AlimentResume } from "@/sources/source";
import type { Contexte } from "./contexte";
import { versEntree, type QuantiteSaisie } from "./journal";

/** Un Récent : un Aliment noté récemment, avec la quantité de sa dernière Entrée. */
export type Recent = { aliment: AlimentResume; quantite: QuantiteSaisie };

export const NOMBRE_RECENTS = 20;

/**
 * Les Récents : les 20 derniers Aliments distincts notés, du plus récemment noté au plus ancien,
 * chacun avec la quantité de sa dernière Entrée, telle qu'elle a été saisie. Un Aliment supprimé
 * n'en fait plus partie. Avec `texte`, seuls les Récents qui correspondent à la recherche.
 */
export async function lireRecents(ctx: Contexte, texte?: string): Promise<Recent[]> {
  const requete = texte === undefined ? null : requetePleinTexte(texte);
  if (texte !== undefined && !requete) return [];

  const derniere = ctx.db
    .selectDistinctOn([entree.alimentId])
    .from(entree)
    .where(and(eq(entree.userId, ctx.userId), isNotNull(entree.alimentId)))
    .orderBy(entree.alimentId, desc(entree.creeLe), desc(entree.id))
    .as("derniere");

  const lignes = await ctx.db
    .select({ entree: derniere._.selectedFields, aliment })
    .from(derniere)
    .innerJoin(aliment, eq(aliment.id, derniere.alimentId))
    .where(
      requete
        ? sql`to_tsvector('french', ${aliment.nomRecherche}) @@ to_tsquery('french', ${requete})`
        : undefined,
    )
    .orderBy(desc(derniere.creeLe), desc(derniere.id))
    .limit(NOMBRE_RECENTS);

  return lignes.map(({ entree: e, aliment: a }) => ({
    aliment: { id: a.id, type: a.type, nom: a.nom, marque: a.marque, kcal: a.kcal, unite: a.unite },
    quantite: versEntree(e).quantite,
  }));
}
