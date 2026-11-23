import { REPAS, type Repas } from "./repas";

/** kcal et Macros (en g). */
export type Macros = { kcal: number; proteines: number; glucides: number; lipides: number };

/** Les nutriments facultatifs (en g) : null quand ils ne sont pas connus. */
export type NutrimentsFacultatifs = {
  fibres: number | null;
  sucres: number | null;
  satures: number | null;
  sel: number | null;
};

/** Les valeurs nutritionnelles d'un Aliment (pour 100 g) ou d'une Entrée (pour sa quantité). */
export type ValeursNutritionnelles = Macros & NutrimentsFacultatifs;

export const NUTRIMENTS_FACULTATIFS = ["fibres", "sucres", "satures", "sel"] as const;

/** Une quantité saisie : en g, en ml (1 ml = 1 g) ou en nombre de Portions. */
export type Quantite =
  | { unite: "g" | "ml"; valeur: number }
  | { unite: "portion"; nombre: number; grammesParPortion: number };

export function quantiteEnGrammes(q: Quantite): number {
  return q.unite === "portion" ? q.nombre * q.grammesParPortion : q.valeur;
}

/** Les valeurs d'une Entrée de `grammes` g, à partir des valeurs pour 100 g. */
export function valeursEntree(pour100g: ValeursNutritionnelles, grammes: number): ValeursNutritionnelles {
  const f = grammes / 100;
  const facultatif = (v: number | null) => (v === null ? null : v * f);
  return {
    kcal: pour100g.kcal * f,
    proteines: pour100g.proteines * f,
    glucides: pour100g.glucides * f,
    lipides: pour100g.lipides * f,
    fibres: facultatif(pour100g.fibres),
    sucres: facultatif(pour100g.sucres),
    satures: facultatif(pour100g.satures),
    sel: facultatif(pour100g.sel),
  };
}

const zero = (): Macros => ({ kcal: 0, proteines: 0, glucides: 0, lipides: 0 });

function ajouter(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    proteines: a.proteines + b.proteines,
    glucides: a.glucides + b.glucides,
    lipides: a.lipides + b.lipides,
  };
}

export type TotauxDuJour = { jour: Macros; parRepas: Record<Repas, Macros> };

/** Les totaux du jour et de chaque Repas, à partir des valeurs de chaque Entrée. */
export function totauxDuJour(entrees: { repas: Repas; valeurs: Macros }[]): TotauxDuJour {
  const parRepas = Object.fromEntries(REPAS.map((r) => [r, zero()])) as Record<Repas, Macros>;
  let jour = zero();
  for (const e of entrees) {
    parRepas[e.repas] = ajouter(parRepas[e.repas], e.valeurs);
    jour = ajouter(jour, e.valeurs);
  }
  return { jour, parRepas };
}

/** Ce qu'il reste à consommer par rapport à l'objectif du jour (négatif quand il est dépassé). */
export function resteDuJour(
  objectif: { kcal: number; macros: { glucides: number; proteines: number; lipides: number } },
  total: Macros,
): Macros {
  return {
    kcal: objectif.kcal - total.kcal,
    proteines: objectif.macros.proteines - total.proteines,
    glucides: objectif.macros.glucides - total.glucides,
    lipides: objectif.macros.lipides - total.lipides,
  };
}
