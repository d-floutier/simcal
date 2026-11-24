import type { Objectif } from "./objectif";

/**
 * Le Poids cible est atteint quand le poids l'a rejoint ou dépassé dans le sens de l'Objectif :
 * en dessous en perdant, au-dessus en prenant. En maintenant, il n'y a rien à atteindre.
 */
export function poidsCibleAtteint(objectif: Objectif, poidsKg: number): boolean {
  if (objectif.sens === "perdre") return poidsKg <= objectif.poidsCibleKg;
  if (objectif.sens === "prendre") return poidsKg >= objectif.poidsCibleKg;
  return false;
}

/** Les kg qui restent à perdre ou à prendre (0 une fois atteint), null en maintenant. */
export function ecartPoidsCible(objectif: Objectif, poidsKg: number): number | null {
  if (objectif.sens === "maintenir") return null;
  const ecart = objectif.sens === "perdre" ? poidsKg - objectif.poidsCibleKg : objectif.poidsCibleKg - poidsKg;
  return Math.max(0, ecart);
}
