import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { normaliserEmail } from "./liste-autorisee";

/** Error message Better Auth returns (HTTP 403) when an email is not on the allowlist. */
export const INSCRIPTION_NON_AUTORISEE = "SIGNUP_NOT_ALLOWED";

export type AuthOptions = {
  db: Db;
  /** Emails allowed to create an account (closed sign-up). */
  emailsAutorises: string[];
  secret: string;
  baseURL?: string;
  plugins?: BetterAuthPlugin[];
};

const TRENTE_JOURS = 60 * 60 * 24 * 30;

export function createAuth(opts: AuthOptions) {
  const autorises = new Set(opts.emailsAutorises.map(normaliserEmail));
  const verifier = (email: unknown) => {
    if (typeof email !== "string" || !autorises.has(normaliserEmail(email))) {
      throw new APIError("FORBIDDEN", { message: INSCRIPTION_NON_AUTORISEE });
    }
  };

  return betterAuth({
    secret: opts.secret,
    baseURL: opts.baseURL,
    database: drizzleAdapter(opts.db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    // Rester connecté sur mobile : session de 30 jours, prolongée chaque jour d'usage.
    session: { expiresIn: TRENTE_JOURS, updateAge: 60 * 60 * 24 },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") verifier(ctx.body?.email);
      }),
    },
    databaseHooks: {
      // Ceinture et bretelles : aucune création d'utilisateur hors de la liste.
      user: {
        create: {
          before: async (user) => {
            verifier(user.email);
            return { data: user };
          },
        },
      },
    },
    plugins: opts.plugins ?? [],
  });
}

export type Auth = ReturnType<typeof createAuth>;
