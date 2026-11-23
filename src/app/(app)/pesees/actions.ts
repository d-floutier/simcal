"use server";

import { refresh } from "next/cache";
import { requireContexte } from "@/lib/profil";
import {
  enregistrerPesee,
  passerEnMaintien,
  PeseeInvalide,
  refuserMaintien,
  supprimerPesee,
  type ChampPesee,
} from "@/services";
import { textes } from "@/ui/textes";

export type EtatPesee = { erreurs?: ChampPesee[]; erreur?: string; enregistree?: boolean };

export async function enregistrerPeseeAction(_: EtatPesee, formData: FormData): Promise<EtatPesee> {
  const ctx = await requireContexte();
  const brut = String(formData.get("poidsKg") ?? "").trim().replace(",", ".");
  try {
    await enregistrerPesee(ctx, {
      jour: String(formData.get("jour") ?? ""),
      poidsKg: brut === "" ? Number.NaN : Number(brut),
    });
  } catch (e) {
    if (e instanceof PeseeInvalide) return { erreurs: e.champs };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return { enregistree: true };
}

export async function supprimerPeseeAction(formData: FormData): Promise<void> {
  const ctx = await requireContexte();
  await supprimerPesee(ctx, String(formData.get("jour") ?? ""));
  refresh();
}

export async function repondrePropositionAction(formData: FormData): Promise<void> {
  const ctx = await requireContexte();
  if (formData.get("reponse") === "accepter") await passerEnMaintien(ctx);
  else await refuserMaintien(ctx);
  refresh();
}
