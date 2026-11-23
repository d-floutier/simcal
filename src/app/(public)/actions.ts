"use server";

import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { INSCRIPTION_NON_AUTORISEE } from "@/lib/auth/create-auth";
import { textes } from "@/ui/textes";

export type EtatFormulaire = { erreur?: string; email?: string };

function lireChamps(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("motDePasse") ?? ""),
  };
}

export async function seConnecter(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { email, password } = lireChamps(formData);
  try {
    await getAuth().api.signInEmail({ body: { email, password, rememberMe: true } });
  } catch (e) {
    if (e instanceof APIError && (e.statusCode === 401 || e.statusCode === 400)) {
      return { email, erreur: textes.connexion.identifiantsInvalides };
    }
    console.error(e);
    return { email, erreur: textes.erreurs.inattendue };
  }
  redirect("/");
}

export async function creerCompte(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { email, password } = lireChamps(formData);
  try {
    await getAuth().api.signUpEmail({ body: { email, password, name: email.split("@")[0] } });
  } catch (e) {
    return { email, erreur: messageInscription(e) };
  }
  redirect("/");
}

function messageInscription(e: unknown): string {
  if (!(e instanceof APIError)) {
    console.error(e);
    return textes.erreurs.inattendue;
  }
  const code = (e.body as { code?: string; message?: string } | undefined) ?? {};
  if (code.message === INSCRIPTION_NON_AUTORISEE) return textes.inscription.nonAutorisee;
  switch (code.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return textes.inscription.dejaInscrit;
    case "PASSWORD_TOO_SHORT":
      return textes.inscription.motDePasseTropCourt;
    case "INVALID_EMAIL":
      return textes.inscription.emailInvalide;
  }
  if (e.statusCode === 400) return textes.inscription.emailInvalide;
  console.error(e);
  return textes.erreurs.inattendue;
}

export async function seDeconnecter() {
  const { headers } = await import("next/headers");
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/connexion");
}
