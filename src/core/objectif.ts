import { dateUTC, type Jour } from "./jour";

/** L'âge en années révolues, au jour donné, d'une personne née à la date donnée. */
export function age(dateNaissance: Jour, jour: Jour): number {
  const naissance = dateUTC(dateNaissance);
  const date = dateUTC(jour);
  const moisNaissance = naissance.getUTCMonth();
  const mois = date.getUTCMonth();
  const anniversairePasse =
    mois > moisNaissance || (mois === moisNaissance && date.getUTCDate() >= naissance.getUTCDate());
  return date.getUTCFullYear() - naissance.getUTCFullYear() - (anniversairePasse ? 0 : 1);
}

/** Le sexe pour le calcul : les formules d'estimation des dépenses en dépendent. */
export type Sexe = "homme" | "femme";

/** La Dépense de repos (kcal/jour), estimée avec Mifflin-St Jeor. */
export function depenseDeRepos(p: { sexe: Sexe; poidsKg: number; tailleCm: number; age: number }): number {
  const base = 10 * p.poidsKg + 6.25 * p.tailleCm - 5 * p.age;
  return p.sexe === "homme" ? base + 5 : base - 161;
}

export const NIVEAUX_ACTIVITE = ["sedentaire", "leger", "modere", "intense"] as const;
export type NiveauActivite = (typeof NIVEAUX_ACTIVITE)[number];

const FACTEURS_ACTIVITE: Record<NiveauActivite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  intense: 1.725,
};

/** La Dépense totale (kcal/jour) : la Dépense de repos multipliée par le facteur d'activité. */
export function depenseTotale(depenseRepos: number, niveau: NiveauActivite): number {
  return depenseRepos * FACTEURS_ACTIVITE[niveau];
}

export const SENS_OBJECTIF = ["perdre", "maintenir", "prendre"] as const;
export type SensObjectif = (typeof SENS_OBJECTIF)[number];

export const RYTHMES = [0.25, 0.5, 0.75] as const;
/** La variation de poids visée, en kg par semaine. */
export type Rythme = (typeof RYTHMES)[number];

/** L'Objectif : maintenir, ou perdre / prendre jusqu'à un Poids cible à un Rythme donné. */
export type Objectif =
  | { sens: "maintenir" }
  | { sens: "perdre" | "prendre"; poidsCibleKg: number; rythme: Rythme };

/** kcal stockées dans 1 kg de masse corporelle. */
const KCAL_PAR_KG = 7700;

const PLANCHER_MINIMAL: Record<Sexe, number> = { femme: 1200, homme: 1500 };

export type ResultatObjectifCalorique = {
  kcal: number;
  /** Le plus élevé de la Dépense de repos et du minimum selon le sexe. */
  plancher: number;
  /** Vrai quand le plancher a relevé l'Objectif calorique. */
  plancherApplique: boolean;
};

/**
 * L'Objectif calorique (kcal/jour) : la Dépense totale corrigée du déficit ou du surplus
 * (Rythme × 7 700 ÷ 7), jamais sous le plancher de sécurité.
 */
export function objectifCalorique(p: {
  sexe: Sexe;
  depenseRepos: number;
  depenseTotale: number;
  objectif: Objectif;
}): ResultatObjectifCalorique {
  const ecart = p.objectif.sens === "maintenir" ? 0 : (p.objectif.rythme * KCAL_PAR_KG) / 7;
  const visee = p.objectif.sens === "perdre" ? p.depenseTotale - ecart : p.depenseTotale + ecart;
  const plancher = Math.max(p.depenseRepos, PLANCHER_MINIMAL[p.sexe]);
  return visee < plancher
    ? { kcal: plancher, plancher, plancherApplique: true }
    : { kcal: visee, plancher, plancherApplique: false };
}

/** La Répartition des macros : la part (en %) des kcal attribuée à chaque Macro. */
export type Repartition = { glucides: number; proteines: number; lipides: number };

export const REPARTITION_PAR_DEFAUT: Repartition = { glucides: 50, proteines: 20, lipides: 30 };

const KCAL_PAR_GRAMME: Repartition = { glucides: 4, proteines: 4, lipides: 9 };

export class RepartitionInvalide extends Error {
  constructor(readonly total: number) {
    super(`La Répartition des macros totalise ${total} % au lieu de 100 %.`);
    this.name = "RepartitionInvalide";
  }
}

export function totalRepartition(r: Repartition): number {
  return r.glucides + r.proteines + r.lipides;
}

/** Les cibles de Macros en grammes pour un Objectif calorique donné. */
export function ciblesMacros(kcal: number, r: Repartition): Repartition {
  const total = totalRepartition(r);
  if (Math.abs(total - 100) > 1e-9) throw new RepartitionInvalide(total);
  return {
    glucides: (kcal * r.glucides) / 100 / KCAL_PAR_GRAMME.glucides,
    proteines: (kcal * r.proteines) / 100 / KCAL_PAR_GRAMME.proteines,
    lipides: (kcal * r.lipides) / 100 / KCAL_PAR_GRAMME.lipides,
  };
}

/** Tout ce qui détermine l'Objectif calorique et les cibles de Macros d'un jour. */
export type ParametresObjectif = {
  sexe: Sexe;
  dateNaissance: Jour;
  tailleCm: number;
  poidsKg: number;
  niveauActivite: NiveauActivite;
  objectif: Objectif;
  repartition: Repartition;
};

export type ObjectifCalcule = ResultatObjectifCalorique & {
  age: number;
  depenseRepos: number;
  depenseTotale: number;
  /** Les cibles de Macros en grammes. */
  macros: Repartition;
};

/** L'Objectif calorique et les cibles de Macros, avec l'âge atteint au jour donné. */
export function calculerObjectif(p: ParametresObjectif, jour: Jour): ObjectifCalcule {
  const a = age(p.dateNaissance, jour);
  const repos = depenseDeRepos({ sexe: p.sexe, poidsKg: p.poidsKg, tailleCm: p.tailleCm, age: a });
  const totale = depenseTotale(repos, p.niveauActivite);
  const resultat = objectifCalorique({
    sexe: p.sexe,
    depenseRepos: repos,
    depenseTotale: totale,
    objectif: p.objectif,
  });
  return {
    ...resultat,
    age: a,
    depenseRepos: repos,
    depenseTotale: totale,
    macros: ciblesMacros(resultat.kcal, p.repartition),
  };
}
