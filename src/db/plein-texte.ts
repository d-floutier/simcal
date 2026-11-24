import { sql, type SQL } from "drizzle-orm";
import { normaliserRecherche } from "@/core";
import { aliment } from "./aliments-schema";

/** La requête plein texte : chaque mot, au début d'un mot du nom (« pom » trouve « pomme »). */
function requetePleinTexte(texte: string): string | null {
  const mots = normaliserRecherche(texte).split(" ").filter(Boolean);
  return mots.length === 0 ? null : mots.map((m) => `${m}:*`).join(" & ");
}

/**
 * La recherche plein texte français sur le nom des Aliments (index `aliment_recherche_idx`) :
 * la condition pour un `where` et la pertinence pour un tri. Null quand le texte n'a aucun mot.
 */
export function recherchePleinTexte(texte: string): { correspond: SQL; pertinence: SQL } | null {
  const requete = requetePleinTexte(texte);
  if (!requete) return null;
  const tsquery = sql`to_tsquery('french', ${requete})`;
  const vecteur = sql`to_tsvector('french', ${aliment.nomRecherche})`;
  return { correspond: sql`${vecteur} @@ ${tsquery}`, pertinence: sql`ts_rank(${vecteur}, ${tsquery})` };
}
