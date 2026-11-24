import { estJourValide, estRepas, jourCalendaire, type Jour, type Repas } from "@/core";

/** Le jour demandé dans l'URL s'il est valide et pas futur ; aujourd'hui sinon. */
export function jourDemande(valeur: unknown, fuseau: string): { jour: Jour; aujourdhui: Jour } {
  const aujourdhui = jourCalendaire(new Date(), fuseau);
  const jour = typeof valeur === "string" && estJourValide(valeur) && valeur <= aujourdhui ? valeur : aujourdhui;
  return { jour, aujourdhui };
}

/** Le Repas demandé dans l'URL, ou le petit-déjeuner par défaut. */
export function repasDemande(valeur: unknown): Repas {
  return estRepas(valeur) ? valeur : "petit-dejeuner";
}
