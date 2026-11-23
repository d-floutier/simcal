"use server";

import { refresh } from "next/cache";
import { requireContexte } from "@/lib/profil";
import {
  ajouterVerre,
  JourFutur,
  modifierReglagesHydratation,
  ReglagesHydratationInvalides,
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
    if (e instanceof JourFutur) return { erreur: textes.entree.jourFutur };
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

const lireMl = (v: FormDataEntryValue | null) => {
  const brut = String(v ?? "").trim().replace(",", ".");
  return brut === "" ? Number.NaN : Number(brut);
};

export async function modifierReglagesHydratationAction(
  _: EtatReglagesHydratation,
  formData: FormData,
): Promise<EtatReglagesHydratation> {
  const ctx = await requireContexte();
  try {
    await modifierReglagesHydratation(ctx, {
      objectifMl: lireMl(formData.get("objectifMl")),
      verreMl: lireMl(formData.get("verreMl")),
    });
  } catch (e) {
    if (e instanceof ReglagesHydratationInvalides) return { erreurs: e.champs };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return { enregistre: true };
}
