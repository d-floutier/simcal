"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { NUTRIMENTS_FACULTATIFS } from "@/core";
import { requireContexte } from "@/lib/profil";
import {
  AlimentIntrouvable,
  ajouterPortion,
  creerAlimentPersonnalise,
  modifierAlimentPersonnalise,
  modifierPortion,
  PortionIntrouvable,
  SaisieAlimentInvalide,
  SaisiePortionInvalide,
  supprimerAlimentPersonnalise,
  supprimerPortion,
  type ChampAlimentPersonnalise,
  type ChampPortion,
  type SaisieAlimentPersonnalise,
} from "@/services";
import { textes } from "@/ui/textes";

export type EtatAliment = { erreurs?: ChampAlimentPersonnalise[]; erreur?: string; enregistre?: boolean };
export type EtatPortion = { erreurs?: ChampPortion[]; erreur?: string; enregistree?: boolean };

/** Un nombre saisi (virgule acceptée) : NaN s'il manque, pour qu'un champ obligatoire soit refusé. */
function nombre(formData: FormData, champ: string): number {
  const brut = String(formData.get(champ) ?? "").trim().replace(",", ".");
  return brut === "" ? Number.NaN : Number(brut);
}

/** Un nutriment facultatif : null quand il est laissé vide. */
function facultatif(formData: FormData, champ: string): number | null {
  return String(formData.get(champ) ?? "").trim() === "" ? null : nombre(formData, champ);
}

function lireAliment(formData: FormData): SaisieAlimentPersonnalise {
  return {
    nom: String(formData.get("nom") ?? ""),
    unite: String(formData.get("unite") ?? "g") as "g" | "ml",
    codeBarres: String(formData.get("codeBarres") ?? ""),
    valeurs: {
      kcal: nombre(formData, "kcal"),
      proteines: nombre(formData, "proteines"),
      glucides: nombre(formData, "glucides"),
      lipides: nombre(formData, "lipides"),
      ...Object.fromEntries(NUTRIMENTS_FACULTATIFS.map((n) => [n, facultatif(formData, n)])),
    },
  };
}

function erreurAliment(e: unknown): EtatAliment {
  if (e instanceof SaisieAlimentInvalide) return { erreurs: e.champs };
  if (e instanceof AlimentIntrouvable) return { erreur: textes.personnalises.introuvable };
  console.error(e);
  return { erreur: textes.erreurs.inattendue };
}

/** Crée l'Aliment (puis ouvre sa page pour ses Portions), ou modifie celui dont l'id est donné. */
export async function enregistrerAlimentAction(_: EtatAliment, formData: FormData): Promise<EtatAliment> {
  const ctx = await requireContexte();
  const id = String(formData.get("id") ?? "");
  let creeId: string;
  try {
    if (id) {
      await modifierAlimentPersonnalise(ctx, id, lireAliment(formData));
      refresh();
      return { enregistre: true };
    }
    ({ id: creeId } = await creerAlimentPersonnalise(ctx, lireAliment(formData)));
  } catch (e) {
    return erreurAliment(e);
  }
  redirect(`/mes-aliments/${creeId}`);
}

export async function supprimerAlimentAction(_: EtatAliment, formData: FormData): Promise<EtatAliment> {
  const ctx = await requireContexte();
  try {
    await supprimerAlimentPersonnalise(ctx, String(formData.get("id") ?? ""));
  } catch (e) {
    return erreurAliment(e);
  }
  redirect("/mes-aliments");
}

function erreurPortion(e: unknown): EtatPortion {
  if (e instanceof SaisiePortionInvalide) return { erreurs: e.champs };
  if (e instanceof AlimentIntrouvable) return { erreur: textes.personnalises.introuvable };
  if (e instanceof PortionIntrouvable) return { erreur: textes.erreurs.inattendue };
  console.error(e);
  return { erreur: textes.erreurs.inattendue };
}

/** Ajoute une Portion à l'Aliment `alimentId`, ou modifie la Portion `portionId`. */
export async function enregistrerPortionAction(_: EtatPortion, formData: FormData): Promise<EtatPortion> {
  const ctx = await requireContexte();
  const saisie = { nom: String(formData.get("nom") ?? ""), grammes: nombre(formData, "grammes") };
  const portionId = String(formData.get("portionId") ?? "");
  try {
    if (portionId) await modifierPortion(ctx, portionId, saisie);
    else await ajouterPortion(ctx, String(formData.get("alimentId") ?? ""), saisie);
  } catch (e) {
    return erreurPortion(e);
  }
  refresh();
  return { enregistree: true };
}

export async function supprimerPortionAction(formData: FormData): Promise<void> {
  const ctx = await requireContexte();
  try {
    await supprimerPortion(ctx, String(formData.get("portionId") ?? ""));
  } catch (e) {
    if (!(e instanceof PortionIntrouvable)) throw e;
  }
  refresh();
}
