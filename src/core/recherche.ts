/**
 * La forme d'un texte utilisée pour chercher un Aliment : sans accents ni casse, ligatures
 * développées (œ → oe), ponctuation remplacée par des espaces.
 */
export function normaliserRecherche(texte: string): string {
  return texte
    .toLowerCase()
    .replaceAll("œ", "oe")
    .replaceAll("æ", "ae")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
