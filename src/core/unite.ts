export const UNITES_ALIMENT = ["g", "ml"] as const;
/** L'unité de référence d'un Aliment : ses valeurs sont pour 100 g ou pour 100 ml. */
export type UniteAliment = (typeof UNITES_ALIMENT)[number];

/** Vrai pour « g » ou « ml » (par exemple une valeur lue dans un formulaire). */
export function estUniteAliment(valeur: unknown): valeur is UniteAliment {
  return UNITES_ALIMENT.includes(valeur as UniteAliment);
}
