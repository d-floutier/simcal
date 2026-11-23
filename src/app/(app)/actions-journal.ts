"use server";

import { redirect } from "next/navigation";
import type { Repas } from "@/core";
import { requireContexte } from "@/lib/profil";
import {
  ajouterEntree,
  EntreeIntrouvable,
  JourFutur,
  lireEntree,
  modifierEntree,
  SaisieEntreeInvalide,
  supprimerEntree,
  type ChampEntree,
  type QuantiteSaisie,
} from "@/services";
import { textes } from "@/ui/textes";

export type EtatEntree = { erreurs?: ChampEntree[]; erreur?: string };

function lireQuantite(formData: FormData): QuantiteSaisie {
  const brut = String(formData.get("quantite") ?? "").trim().replace(",", ".");
  return {
    unite: String(formData.get("unite") ?? "g") as QuantiteSaisie["unite"],
    valeur: brut === "" ? Number.NaN : Number(brut),
  };
}

function erreurEntree(e: unknown): EtatEntree {
  if (e instanceof SaisieEntreeInvalide) return { erreurs: e.champs };
  if (e instanceof JourFutur) return { erreur: textes.entree.jourFutur };
  if (e instanceof EntreeIntrouvable) return { erreur: textes.entree.introuvable };
  console.error(e);
  return { erreur: textes.erreurs.inattendue };
}

/** Ajoute une Entrée, puis ouvre le Journal du jour de l'Entrée. */
export async function ajouterEntreeAction(_: EtatEntree, formData: FormData): Promise<EtatEntree> {
  const ctx = await requireContexte();
  const jour = String(formData.get("jour") ?? "");
  try {
    await ajouterEntree(ctx, {
      jour,
      repas: String(formData.get("repas") ?? "") as Repas,
      alimentId: String(formData.get("alimentId") ?? ""),
      quantite: lireQuantite(formData),
    });
  } catch (e) {
    return erreurEntree(e);
  }
  redirect(`/?jour=${jour}`);
}

export async function modifierEntreeAction(_: EtatEntree, formData: FormData): Promise<EtatEntree> {
  const ctx = await requireContexte();
  const id = String(formData.get("id") ?? "");
  let jour: string;
  try {
    ({ jour } = await modifierEntree(ctx, id, {
      repas: String(formData.get("repas") ?? "") as Repas,
      quantite: lireQuantite(formData),
    }));
  } catch (e) {
    return erreurEntree(e);
  }
  redirect(`/?jour=${jour}`);
}

export async function supprimerEntreeAction(_: EtatEntree, formData: FormData): Promise<EtatEntree> {
  const ctx = await requireContexte();
  const id = String(formData.get("id") ?? "");
  const entree = await lireEntree(ctx, id);
  try {
    await supprimerEntree(ctx, id);
  } catch (e) {
    return erreurEntree(e);
  }
  redirect(entree ? `/?jour=${entree.jour}` : "/");
}
