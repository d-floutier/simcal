import { and, asc, desc, eq, gt, lte, sql } from "drizzle-orm";
import { estJourValide, jourCalendaire, type Jour } from "@/core";
import { ajoutHydratation, objectifHistorique, profil } from "@/db/schema";
import { SaisieInvalide } from "./saisie-invalide";
import type { Contexte } from "./contexte";
import { JourFutur } from "./journal";
import { versLigne, versParametres } from "./profil";

/** L'Hydratation d'un jour, comparée à l'Objectif d'hydratation en vigueur ce jour-là. */
export type HydratationDuJour = {
  jour: Jour;
  totalMl: number;
  objectifMl: number;
  /** La taille du Verre réglée aujourd'hui : ce qu'ajoute le prochain Verre. */
  verreMl: number;
  /** Le nombre d'ajouts du jour (0 : rien à retirer). */
  ajouts: number;
};

const OBJECTIF_PAR_DEFAUT_ML = 2000;
const VERRE_PAR_DEFAUT_ML = 250;

async function reglagesCourants(ctx: Contexte) {
  const [p] = await ctx.db
    .select({ fuseau: profil.fuseau, objectifMl: profil.objectifHydratationMl, verreMl: profil.verreMl })
    .from(profil)
    .where(eq(profil.userId, ctx.userId));
  return p ?? { fuseau: "UTC", objectifMl: OBJECTIF_PAR_DEFAUT_ML, verreMl: VERRE_PAR_DEFAUT_ML };
}

/**
 * L'Objectif d'hydratation en vigueur le jour donné : celui du dernier objectif enregistré à cette
 * date ou avant. Avant le premier, c'est l'Objectif d'hydratation par défaut (2 L).
 */
export async function objectifHydratationDuJour(ctx: Contexte, jour: Jour): Promise<number> {
  const [ligne] = await ctx.db
    .select({ ml: objectifHistorique.objectifHydratationMl })
    .from(objectifHistorique)
    .where(and(eq(objectifHistorique.userId, ctx.userId), lte(objectifHistorique.depuis, jour)))
    .orderBy(desc(objectifHistorique.depuis))
    .limit(1);
  return ligne?.ml ?? OBJECTIF_PAR_DEFAUT_ML;
}

export async function lireHydratation(ctx: Contexte, jour: Jour): Promise<HydratationDuJour> {
  const reglages = await reglagesCourants(ctx);
  const [somme] = await ctx.db
    .select({ totalMl: sql<number>`coalesce(sum(${ajoutHydratation.ml}), 0)::int`, ajouts: sql<number>`count(*)::int` })
    .from(ajoutHydratation)
    .where(and(eq(ajoutHydratation.userId, ctx.userId), eq(ajoutHydratation.jour, jour)));
  return {
    jour,
    totalMl: somme.totalMl,
    objectifMl: await objectifHydratationDuJour(ctx, jour),
    verreMl: reglages.verreMl,
    ajouts: somme.ajouts,
  };
}

/** Un ajout d'Hydratation : un Verre noté pour un jour, de la taille réglée à ce moment-là. */
export type AjoutHydratation = { jour: Jour; ml: number; creeLe: Date };

/** Tous les ajouts d'Hydratation de l'utilisateur, du plus ancien au plus récent. */
export async function listerAjoutsHydratation(ctx: Contexte): Promise<AjoutHydratation[]> {
  return ctx.db
    .select({ jour: ajoutHydratation.jour, ml: ajoutHydratation.ml, creeLe: ajoutHydratation.creeLe })
    .from(ajoutHydratation)
    .where(eq(ajoutHydratation.userId, ctx.userId))
    .orderBy(asc(ajoutHydratation.jour), asc(ajoutHydratation.id));
}

/** Ajoute un Verre de la taille réglée au jour donné (aujourd'hui ou un jour passé). */
export async function ajouterVerre(ctx: Contexte, jour: Jour, instant: Date = new Date()): Promise<HydratationDuJour> {
  const reglages = await reglagesCourants(ctx);
  const aujourdhui = jourCalendaire(instant, reglages.fuseau);
  if (!estJourValide(jour)) throw new Error(`Jour illisible : ${jour}`);
  if (jour > aujourdhui) throw new JourFutur(jour, aujourdhui);
  await ctx.db.insert(ajoutHydratation).values({ userId: ctx.userId, jour, ml: reglages.verreMl });
  return lireHydratation(ctx, jour);
}

/** Retire un Verre : annule le dernier ajout du jour donné. Sans ajout ce jour-là, ne fait rien. */
export async function retirerVerre(ctx: Contexte, jour: Jour): Promise<HydratationDuJour> {
  if (!estJourValide(jour)) throw new Error(`Jour illisible : ${jour}`);
  const dernier = ctx.db
    .select({ id: ajoutHydratation.id })
    .from(ajoutHydratation)
    .where(and(eq(ajoutHydratation.userId, ctx.userId), eq(ajoutHydratation.jour, jour)))
    .orderBy(desc(ajoutHydratation.id))
    .limit(1);
  await ctx.db
    .delete(ajoutHydratation)
    .where(and(eq(ajoutHydratation.userId, ctx.userId), eq(ajoutHydratation.id, sql`(${dernier})`)));
  return lireHydratation(ctx, jour);
}

export type ReglagesHydratation = { objectifMl: number; verreMl: number };

export type ChampHydratation = keyof ReglagesHydratation;

export class SaisieHydratationInvalide extends SaisieInvalide<ChampHydratation> {
  constructor(champs: ChampHydratation[]) {
    super("Réglages d'hydratation", champs);
  }
}

export const BORNES_HYDRATATION = {
  objectifMl: { min: 250, max: 10_000 },
  verreMl: { min: 10, max: 2000 },
} as const;

/** L'Objectif d'hydratation courant et la taille du Verre. */
export async function lireReglagesHydratation(ctx: Contexte): Promise<ReglagesHydratation> {
  const { objectifMl, verreMl } = await reglagesCourants(ctx);
  return { objectifMl, verreMl };
}

/**
 * Modifie l'Objectif d'hydratation et la taille du Verre. Le nouvel Objectif d'hydratation vaut
 * à partir d'aujourd'hui (fuseau du Profil), dans l'historique de l'objectif : les jours passés
 * gardent le leur. La taille du Verre ne vaut que pour les prochains ajouts.
 */
export async function modifierReglagesHydratation(
  ctx: Contexte,
  reglages: ReglagesHydratation,
  instant: Date = new Date(),
): Promise<void> {
  const invalides = (Object.keys(BORNES_HYDRATATION) as ChampHydratation[]).filter((c) => {
    const x = reglages[c];
    return !(Number.isInteger(x) && x >= BORNES_HYDRATATION[c].min && x <= BORNES_HYDRATATION[c].max);
  });
  if (invalides.length > 0) throw new SaisieHydratationInvalide(invalides);
  const { objectifMl, verreMl } = reglages;

  await ctx.db.transaction(async (tx) => {
    const [p] = await tx.select().from(profil).where(eq(profil.userId, ctx.userId));
    if (!p) throw new Error("Pas de Profil : la première configuration doit précéder l'Hydratation.");
    const jour = jourCalendaire(instant, p.fuseau);
    await tx
      .update(profil)
      .set({ objectifHydratationMl: objectifMl, verreMl, misAJour: new Date() })
      .where(eq(profil.userId, ctx.userId));
    await tx
      .update(objectifHistorique)
      .set({ objectifHydratationMl: objectifMl })
      .where(and(eq(objectifHistorique.userId, ctx.userId), gt(objectifHistorique.depuis, jour)));
    // Une ligne d'historique à aujourd'hui, avec les paramètres caloriques en vigueur.
    const [enVigueur] = await tx
      .select()
      .from(objectifHistorique)
      .where(and(eq(objectifHistorique.userId, ctx.userId), lte(objectifHistorique.depuis, jour)))
      .orderBy(desc(objectifHistorique.depuis))
      .limit(1);
    const ligne = { ...versLigne(versParametres(enVigueur ?? p)), userId: ctx.userId, depuis: jour };
    await tx
      .insert(objectifHistorique)
      .values({ ...ligne, objectifHydratationMl: objectifMl })
      .onConflictDoUpdate({
        target: [objectifHistorique.userId, objectifHistorique.depuis],
        set: { objectifHydratationMl: objectifMl },
      });
  });
}
