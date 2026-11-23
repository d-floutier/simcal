import { asc, eq } from "drizzle-orm";
import type { Jour, NiveauActivite, Repartition, SensObjectif, Sexe } from "@/core";
import { entree, objectifHistorique, profil, user } from "@/db/schema";
import type { FicheAliment } from "./aliments";
import type { Contexte } from "./contexte";
import { listerAjoutsHydratation } from "./hydratation";
import { versEntree, type Entree } from "./journal";
import { listerAlimentsPersonnalises } from "./personnalises";
import { listerPesees, type Pesee } from "./pesees";

/** Les paramètres d'un Objectif, tels qu'ils sont gardés dans le Profil et l'historique. */
type ParametresExportes = {
  sexe: Sexe;
  dateNaissance: Jour;
  tailleCm: number;
  poidsKg: number;
  niveauActivite: NiveauActivite;
  sens: SensObjectif;
  poidsCibleKg: number | null;
  rythme: number | null;
  repartition: Repartition;
  objectifHydratationMl: number;
};

/**
 * L'export de toutes les données personnelles d'un utilisateur. Le compte n'y figure que par ce
 * qu'il a de lisible : jamais de mot de passe, de jeton de session ni d'identifiant interne.
 * `version` change quand la forme de l'export change.
 */
export type ExportDonnees = {
  format: "simcal-export";
  version: 1;
  exporteLe: string;
  compte: { email: string; nom: string; emailVerifie: boolean; creeLe: string; misAJour: string };
  profil:
    | (ParametresExportes & {
        fuseau: string;
        verreMl: number;
        maintienRefusePour: string | null;
        misAJour: string;
      })
    | null;
  /** L'historique de l'Objectif, du plus ancien au plus récent ; chaque ligne vaut à partir de `depuis`. */
  objectifs: (ParametresExportes & { depuis: Jour })[];
  /** Les Entrées du Journal, du plus ancien jour au plus récent, avec leur copie des valeurs. */
  entrees: Entree[];
  /** Les Pesées, du plus ancien jour au plus récent. */
  pesees: Pesee[];
  /** Les ajouts d'Hydratation, du plus ancien au plus récent. */
  hydratation: { jour: Jour; ml: number; creeLe: string }[];
  /** Les Aliments personnalisés et leurs Portions. */
  alimentsPersonnalises: FicheAliment[];
};

type LigneParametres = typeof objectifHistorique.$inferSelect;

function parametres(l: Omit<LigneParametres, "userId" | "depuis">): ParametresExportes {
  return {
    sexe: l.sexe,
    dateNaissance: l.dateNaissance,
    tailleCm: l.tailleCm,
    poidsKg: l.poidsKg,
    niveauActivite: l.niveauActivite,
    sens: l.sens,
    poidsCibleKg: l.poidsCibleKg,
    rythme: l.rythme,
    repartition: { glucides: l.glucidesPct, proteines: l.proteinesPct, lipides: l.lipidesPct },
    objectifHydratationMl: l.objectifHydratationMl,
  };
}

/** Exporte toutes les données personnelles de l'utilisateur connecté. */
export async function exporterDonnees(ctx: Contexte, instant: Date = new Date()): Promise<ExportDonnees> {
  const [compte] = await ctx.db.select().from(user).where(eq(user.id, ctx.userId));
  if (!compte) throw new Error("Compte introuvable.");
  const [p] = await ctx.db.select().from(profil).where(eq(profil.userId, ctx.userId));
  const objectifs = await ctx.db
    .select()
    .from(objectifHistorique)
    .where(eq(objectifHistorique.userId, ctx.userId))
    .orderBy(asc(objectifHistorique.depuis));
  const entrees = await ctx.db
    .select()
    .from(entree)
    .where(eq(entree.userId, ctx.userId))
    .orderBy(asc(entree.jour), asc(entree.creeLe), asc(entree.id));

  return {
    format: "simcal-export",
    version: 1,
    exporteLe: instant.toISOString(),
    compte: {
      email: compte.email,
      nom: compte.name,
      emailVerifie: compte.emailVerified,
      creeLe: compte.createdAt.toISOString(),
      misAJour: compte.updatedAt.toISOString(),
    },
    profil: p
      ? {
          fuseau: p.fuseau,
          ...parametres(p),
          verreMl: p.verreMl,
          maintienRefusePour: p.maintienRefusePour,
          misAJour: p.misAJour.toISOString(),
        }
      : null,
    objectifs: objectifs.map((o) => ({ depuis: o.depuis, ...parametres(o) })),
    entrees: entrees.map(versEntree),
    pesees: (await listerPesees(ctx)).reverse(),
    hydratation: (await listerAjoutsHydratation(ctx)).map((a) => ({ ...a, creeLe: a.creeLe.toISOString() })),
    alimentsPersonnalises: await listerAlimentsPersonnalises(ctx),
  };
}

/** La confirmation de la suppression du compte n'est pas l'email du compte. */
export class ConfirmationSuppressionIncorrecte extends Error {
  constructor() {
    super("Pour supprimer le compte, retapez son email.");
    this.name = "ConfirmationSuppressionIncorrecte";
  }
}

const normaliser = (email: string) => email.trim().toLowerCase();

/**
 * Supprime définitivement le compte et toutes ses données personnelles, après la confirmation
 * explicite qu'est l'email du compte retapé. Supprimer l'utilisateur efface le reste en cascade
 * (clés étrangères) : sessions, mot de passe, Profil, objectifs, Entrées, Pesées, Hydratation,
 * Aliments personnalisés et leurs Portions. Les Aliments génériques, les Produits gardés en base
 * et le cache Open Food Facts, partagés, restent. Ne ferme pas le cookie de session : c'est à
 * l'appelant de déconnecter le navigateur.
 */
export async function supprimerCompte(ctx: Contexte, confirmation: string): Promise<void> {
  const [compte] = await ctx.db.select({ email: user.email }).from(user).where(eq(user.id, ctx.userId));
  if (!compte || typeof confirmation !== "string" || normaliser(confirmation) !== normaliser(compte.email)) {
    throw new ConfirmationSuppressionIncorrecte();
  }
  await ctx.db.delete(user).where(eq(user.id, ctx.userId));
}
