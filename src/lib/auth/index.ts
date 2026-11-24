import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { createAuth, type Auth } from "./create-auth";
import { parseListeAutorisee } from "./liste-autorisee";

const globalForAuth = globalThis as unknown as { simcalAuth?: Auth };

/** The app's Better Auth instance, built lazily from the environment. */
export function getAuth(): Auth {
  globalForAuth.simcalAuth ??= createAuth({
    db: getDb(),
    emailsAutorises: parseListeAutorisee(process.env.SIMCAL_ALLOWED_EMAILS),
    secret: requireEnv("BETTER_AUTH_SECRET"),
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [nextCookies()], // must stay last
  });
  return globalForAuth.simcalAuth;
}

export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

/** The signed-in user, or a redirect to the sign-in page. Call it in every app page and action. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  return session.user;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return value;
}
