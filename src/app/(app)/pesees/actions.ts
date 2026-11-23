"use server";

import { refresh } from "next/cache";
import { nombreDuFormulaire } from "@/lib/nombre-saisi";
import { requireContexte } from "@/lib/profil";
import {
  DernierePesee,
  enregistrerPesee,
  passerEnMaintien,
  SaisiePeseeInvalide,
  refuserMaintien,
  supprimerPesee,
  type ChampPesee,
} from "@/services";
import { textes } from "@/ui/textes";

export type EtatPesee = { erreurs?: ChampPesee[]; erreur?: string; enregistree?: boolean };

export async function enregistrerPeseeAction(_: EtatPesee, formData: FormData): Promise<EtatPesee> {
  const ctx = await requireContexte();
  try {
    await enregistrerPesee(ctx, {
      jour: String(formData.get("jour") ?? ""),
      poidsKg: nombreDuFormulaire(formData, "poidsKg"),
    });
  } catch (e) {
    if (e instanceof SaisiePeseeInvalide) return { erreurs: e.champs };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  refresh();
  return { enregistree: true };
}

export async function supprimerPeseeAction(formData: FormData): Promise<void> {
  const ctx = await requireContexte();
  try {
    await supprimerPesee(ctx, String(formData.get("jour") ?? ""));
  } catch (e) {
    // La page ne propose pas de supprimer la seule Pesée : rien à afficher de plus.
    if (!(e instanceof DernierePesee)) throw e;
  }
  refresh();
}

export async function repondrePropositionAction(formData: FormData): Promise<void> {
  const ctx = await requireContexte();
  if (formData.get("reponse") === "accepter") await passerEnMaintien(ctx);
  else await refuserMaintien(ctx);
  refresh();
}
