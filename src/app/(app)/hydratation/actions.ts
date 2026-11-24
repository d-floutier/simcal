"use server";

import { refresh } from "next/cache";
import { nombreDuFormulaire } from "@/lib/nombre-saisi";
import { requireContexte } from "@/lib/profil";
import {
  ajouterVerre,
  JourFutur,
  modifierReglagesHydratation,
  SaisieHydratationInvalide,
  retirerVerre,
  type ChampHydratation,
} from "@/services";
import { textes } from "@/ui/textes";

export type EtatVerre = { erreur?: string };

export async function ajouterVerreAction(_: EtatVerre, formData: FormData): Promise<EtatVerre> {
  const ctx = await requireContexte();
  try {
    await ajouterVerre(ctx, String(formData.get("jour") ?? ""));
  } catch (e) {
    if (e instanceof JourFutur) return { erreur: textes.hydratation.jourFutur };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return {};
}

export async function retirerVerreAction(_: EtatVerre, formData: FormData): Promise<EtatVerre> {
  const ctx = await requireContexte();
  try {
    await retirerVerre(ctx, String(formData.get("jour") ?? ""));
  } catch (e) {
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return {};
}

export type EtatReglagesHydratation = { erreurs?: ChampHydratation[]; erreur?: string; enregistre?: boolean };

export async function modifierReglagesHydratationAction(
  _: EtatReglagesHydratation,
  formData: FormData,
): Promise<EtatReglagesHydratation> {
  const ctx = await requireContexte();
  try {
    await modifierReglagesHydratation(ctx, {
      objectifMl: nombreDuFormulaire(formData, "objectifMl"),
      verreMl: nombreDuFormulaire(formData, "verreMl"),
    });
  } catch (e) {
    if (e instanceof SaisieHydratationInvalide) return { erreurs: e.champs };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return { enregistre: true };
}
