import type { Macros } from "./entree";
import { jourDecale, type Jour } from "./jour";

/** Les `n` jours qui finissent au jour `au` (inclus), du plus ancien au plus récent. */
export function joursDeLaPeriode(au: Jour, n: number): Jour[] {
  return Array.from({ length: n }, (_, i) => jourDecale(au, i - n + 1));
}

/**
 * Le total de chaque jour donné. Un jour sans Entrée a un total null : c'est un oubli,
 * pas un jour à 0 kcal.
 */
export function totauxParJour(
  jours: Jour[],
  entrees: { jour: Jour; valeurs: Macros }[],
): { jour: Jour; total: Macros | null }[] {
  const parJour = new Map<Jour, Macros>();
  for (const e of entrees) {
    const t = parJour.get(e.jour) ?? { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
    parJour.set(e.jour, {
      kcal: t.kcal + e.valeurs.kcal,
      proteines: t.proteines + e.valeurs.proteines,
      glucides: t.glucides + e.valeurs.glucides,
      lipides: t.lipides + e.valeurs.lipides,
    });
  }
  return jours.map((jour) => ({ jour, total: parJour.get(jour) ?? null }));
}

/** La moyenne des totaux des jours avec Entrée (null quand aucun jour n'en a). */
export function moyenneMacros(totaux: (Macros | null)[]): Macros | null {
  const pleins = totaux.filter((t): t is Macros => t !== null);
  if (pleins.length === 0) return null;
  const moyenne = (cle: keyof Macros) => pleins.reduce((s, t) => s + t[cle], 0) / pleins.length;
  return { kcal: moyenne("kcal"), proteines: moyenne("proteines"), glucides: moyenne("glucides"), lipides: moyenne("lipides") };
}
