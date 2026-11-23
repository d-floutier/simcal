/** 1 kcal = 4,184 kJ. */
export const KJ_PAR_KCAL = 4.184;

/** L'énergie en kcal d'une valeur donnée en kJ (pour un Produit fourni seulement en kJ). */
export function kcalDepuisKj(kj: number): number {
  return kj / KJ_PAR_KCAL;
}
