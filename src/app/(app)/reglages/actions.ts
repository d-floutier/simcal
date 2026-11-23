"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { requireContexte } from "@/lib/profil";
import { ConfirmationSuppressionIncorrecte, supprimerCompte } from "@/services";
import { textes } from "@/ui/textes";

export type EtatSuppression = { erreur?: string };

/** Supprime le compte après la confirmation (l'email retapé), puis ferme la session du navigateur. */
export async function supprimerCompteAction(_: EtatSuppression, formData: FormData): Promise<EtatSuppression> {
  const ctx = await requireContexte();
  try {
    await supprimerCompte(ctx, String(formData.get("confirmation") ?? ""));
  } catch (e) {
    if (e instanceof ConfirmationSuppressionIncorrecte) return { erreur: textes.compte.confirmationIncorrecte };
    console.error(e);
    return { erreur: textes.erreurs.inattendue };
  }
  // Les sessions sont déjà effacées avec le compte : la déconnexion retire le cookie.
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/connexion");
}
