"use server";

import { redirect } from "next/navigation";
import { estRepas, estUniteAliment, type Repas } from "@/core";
import { nombreDuFormulaire } from "@/lib/nombre-saisi";
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

/**
 * La quantité du formulaire : l'unité vaut « g », « ml » ou « portion:<id de la Portion> ».
 * Appelée dans le try de l'action : une unité inconnue est refusée comme une saisie invalide.
 */
function lireQuantite(formData: FormData): QuantiteSaisie {
  const nombre = nombreDuFormulaire(formData, "quantite");
  const unite = String(formData.get("unite") ?? "g");
  if (unite.startsWith("portion:")) return { unite: "portion", portionId: unite.slice("portion:".length), nombre };
  if (!estUniteAliment(unite)) throw new SaisieEntreeInvalide(["quantite"]);
  return { unite, valeur: nombre };
}

function lireRepas(formData: FormData): Repas {
  const repas = formData.get("repas");
  if (!estRepas(repas)) throw new SaisieEntreeInvalide(["repas"]);
  return repas;
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
      repas: lireRepas(formData),
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
      repas: lireRepas(formData),
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
