/** Les quatre Repas fixes qui organisent le Journal, dans l'ordre de la journée. */
export const REPAS = ["petit-dejeuner", "dejeuner", "diner", "collations"] as const;

export type Repas = (typeof REPAS)[number];

/** Vrai pour l'un des quatre Repas (par exemple une valeur lue dans un formulaire). */
export function estRepas(valeur: unknown): valeur is Repas {
  return REPAS.includes(valeur as Repas);
}
