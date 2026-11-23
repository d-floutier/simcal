import { REPAS, type Jour, type ObjectifCalcule, type Repas } from "@/core";
import type { Contexte } from "./contexte";
import { objectifDuJour } from "./profil";

// Une Entrée sera définie par le ticket qui permet d'en ajouter.
export type Entree = never;

export type JournalDuJour = {
  jour: Jour;
  repas: { repas: Repas; entrees: Entree[] }[];
  /** L'Objectif calorique et les cibles de Macros en vigueur ce jour-là (null avant le Profil). */
  objectif: ObjectifCalcule | null;
};

export async function lireJournal(ctx: Contexte, jour: Jour): Promise<JournalDuJour> {
  return {
    jour,
    repas: REPAS.map((repas) => ({ repas, entrees: [] })),
    objectif: await objectifDuJour(ctx, jour),
  };
}
