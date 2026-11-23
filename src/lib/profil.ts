import "server-only";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { lireProfil, type Contexte, type SaisieProfil } from "@/services";

/** Le contexte des services pour l'utilisateur connecté (redirige vers la connexion sinon). */
export async function requireContexte(): Promise<Contexte> {
  const user = await requireUser();
  return { db: getDb(), userId: user.id };
}

/**
 * L'utilisateur connecté et son Profil. Tant que le Profil n'est pas complet, redirige vers
 * la première configuration : chaque page de l'app qui en dépend doit l'appeler.
 */
export async function requireProfil(): Promise<{ ctx: Contexte; profil: SaisieProfil }> {
  const ctx = await requireContexte();
  const profil = await lireProfil(ctx);
  if (!profil) redirect("/configuration");
  return { ctx, profil };
}
