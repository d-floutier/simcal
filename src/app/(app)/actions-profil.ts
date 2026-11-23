"use server";

import { redirect } from "next/navigation";
import type { NiveauActivite, Objectif, Rythme, SensObjectif, Sexe } from "@/core";
import { requireContexte } from "@/lib/profil";
import { enregistrerProfil, SaisieProfilInvalide, type ChampProfil, type SaisieProfil } from "@/services";
import { textes } from "@/ui/textes";

export type EtatProfil = { erreurs?: ChampProfil[]; erreur?: string; enregistre?: boolean };

/** Lit un nombre saisi en français (virgule ou point décimal). Vide ou illisible : NaN. */
function nombre(formData: FormData, nom: string): number {
  const brut = String(formData.get(nom) ?? "").trim().replace(",", ".");
  return brut === "" ? Number.NaN : Number(brut);
}

function texte(formData: FormData, nom: string): string {
  return String(formData.get(nom) ?? "");
}

function lireSaisie(formData: FormData): SaisieProfil {
  const sens = texte(formData, "sens") as SensObjectif;
  const objectif: Objectif =
    sens === "maintenir"
      ? { sens }
      : { sens, poidsCibleKg: nombre(formData, "poidsCibleKg"), rythme: nombre(formData, "rythme") as Rythme };
  return {
    sexe: texte(formData, "sexe") as Sexe,
    dateNaissance: texte(formData, "dateNaissance"),
    tailleCm: nombre(formData, "tailleCm"),
    poidsKg: nombre(formData, "poidsKg"),
    niveauActivite: texte(formData, "niveauActivite") as NiveauActivite,
    fuseau: texte(formData, "fuseau"),
    objectif,
    repartition: {
      glucides: nombre(formData, "glucides"),
      proteines: nombre(formData, "proteines"),
      lipides: nombre(formData, "lipides"),
    },
  };
}

/** Enregistre le Profil. Avec `apres=journal` (première configuration), ouvre ensuite le Journal. */
export async function enregistrerProfilAction(_: EtatProfil, formData: FormData): Promise<EtatProfil> {
  const ctx = await requireContexte();
  try {
    await enregistrerProfil(ctx, lireSaisie(formData));
  } catch (e) {
    if (e instanceof SaisieProfilInvalide) return { erreurs: e.champs };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  if (formData.get("apres") === "journal") redirect("/");
  return { enregistre: true };
}
