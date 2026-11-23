/** Les quatre Repas fixes qui organisent le Journal, dans l'ordre de la journée. */
export const REPAS = ["petit-dejeuner", "dejeuner", "diner", "collations"] as const;

export type Repas = (typeof REPAS)[number];
