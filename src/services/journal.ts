import { REPAS, type Jour, type Repas } from "@/core";
import type { Contexte } from "./contexte";

// Une Entrée sera définie par le ticket qui permet d'en ajouter.
export type Entree = never;

export type JournalDuJour = {
  jour: Jour;
  repas: { repas: Repas; entrees: Entree[] }[];
};

export async function lireJournal(_ctx: Contexte, jour: Jour): Promise<JournalDuJour> {
  return { jour, repas: REPAS.map((repas) => ({ repas, entrees: [] })) };
}
