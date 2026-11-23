import { and, desc, eq, gt, gte, lte } from "drizzle-orm";
import { jourCalendaire, poidsCibleAtteint, type Jour, type Objectif } from "@/core";
import { objectifHistorique, pesee, profil } from "@/db/schema";
import type { Contexte, Transaction as Tx } from "./contexte";
import { dateValide, enregistrerProfil, lireProfil, versLigne, versParametres } from "./profil";

export type Pesee = { jour: Jour; poidsKg: number };

export type ChampPesee = "jour" | "poidsKg";

/** La saisie est refusée : `champs` liste les champs invalides (jour futur ou illisible, poids hors bornes). */
export class PeseeInvalide extends Error {
  constructor(readonly champs: ChampPesee[]) {
    super(`Pesée invalide : ${champs.join(", ")}`);
    this.name = "PeseeInvalide";
  }
}

/** Les Pesées de l'utilisateur, la plus récente en premier, éventuellement bornées (inclus). */
export async function listerPesees(ctx: Contexte, periode: { du?: Jour; au?: Jour } = {}): Promise<Pesee[]> {
  return ctx.db
    .select({ jour: pesee.jour, poidsKg: pesee.poidsKg })
    .from(pesee)
    .where(
      and(
        eq(pesee.userId, ctx.userId),
        periode.du ? gte(pesee.jour, periode.du) : undefined,
        periode.au ? lte(pesee.jour, periode.au) : undefined,
      ),
    )
    .orderBy(desc(pesee.jour));
}

async function plusRecente(tx: Tx, userId: string): Promise<Pesee | undefined> {
  const [p] = await tx
    .select({ jour: pesee.jour, poidsKg: pesee.poidsKg })
    .from(pesee)
    .where(eq(pesee.userId, userId))
    .orderBy(desc(pesee.jour))
    .limit(1);
  return p;
}

/**
 * Le poids devient celui du Profil et de l'objectif à partir du jour donné : une ligne d'historique
 * à ce jour (les autres paramètres sont ceux qui étaient en vigueur), et le nouveau poids dans les
 * lignes postérieures. Les jours passés gardent leur objectif.
 */
async function appliquerPoids(tx: Tx, userId: string, jour: Jour, poidsKg: number) {
  await tx.update(profil).set({ poidsKg, misAJour: new Date() }).where(eq(profil.userId, userId));
  await tx
    .update(objectifHistorique)
    .set({ poidsKg })
    .where(and(eq(objectifHistorique.userId, userId), gt(objectifHistorique.depuis, jour)));
  const [enVigueur] = await tx
    .select()
    .from(objectifHistorique)
    .where(and(eq(objectifHistorique.userId, userId), lte(objectifHistorique.depuis, jour)))
    .orderBy(desc(objectifHistorique.depuis))
    .limit(1);
  // Sans objectif en vigueur ce jour-là, on part du Profil courant.
  const base = enVigueur ?? (await tx.select().from(profil).where(eq(profil.userId, userId)))[0];
  if (!base) return;
  const ligne = {
    ...versLigne(versParametres(base)),
    objectifHydratationMl: base.objectifHydratationMl,
    userId,
    depuis: jour,
    poidsKg,
  };
  await tx
    .insert(objectifHistorique)
    .values(ligne)
    .onConflictDoUpdate({ target: [objectifHistorique.userId, objectifHistorique.depuis], set: { poidsKg } });
}

/**
 * Note une Pesée pour aujourd'hui ou un jour passé (dans le fuseau du Profil), en remplaçant
 * celle du même jour. Si c'est la plus récente, elle devient le poids du Profil et fixe
 * l'objectif à partir de son jour.
 */
export async function enregistrerPesee(ctx: Contexte, saisie: Pesee, instant: Date = new Date()): Promise<void> {
  await ctx.db.transaction(async (tx) => {
    const [p] = await tx.select({ fuseau: profil.fuseau }).from(profil).where(eq(profil.userId, ctx.userId));
    if (!p) throw new Error("Pas de Profil : la première configuration doit précéder les Pesées.");
    const aujourdhui = jourCalendaire(instant, p.fuseau);
    const invalides: ChampPesee[] = [];
    if (!dateValide(saisie.jour) || saisie.jour > aujourdhui) invalides.push("jour");
    if (!(Number.isFinite(saisie.poidsKg) && saisie.poidsKg >= 20 && saisie.poidsKg <= 500)) invalides.push("poidsKg");
    if (invalides.length > 0) throw new PeseeInvalide(invalides);
    await noterPesee(tx, ctx.userId, saisie);
  });
}

/**
 * Note une Pesée déjà validée dans la transaction donnée, en remplaçant celle du même jour.
 * Si c'est la plus récente, elle devient le poids du Profil et fixe l'objectif à partir de son jour.
 */
export async function noterPesee(tx: Tx, userId: string, saisie: Pesee): Promise<void> {
  await tx
    .insert(pesee)
    .values({ userId, jour: saisie.jour, poidsKg: saisie.poidsKg })
    .onConflictDoUpdate({ target: [pesee.userId, pesee.jour], set: { poidsKg: saisie.poidsKg } });
  const recente = await plusRecente(tx, userId);
  if (recente?.jour === saisie.jour) await appliquerPoids(tx, userId, saisie.jour, saisie.poidsKg);
}

/** Refus de supprimer la seule Pesée restante : le Profil a toujours besoin d'un poids. */
export class DernierePesee extends Error {
  constructor() {
    super("La dernière Pesée restante ne peut pas être supprimée.");
    this.name = "DernierePesee";
  }
}

/**
 * Supprime la Pesée du jour donné. Si c'était la plus récente, la précédente reprend son rôle
 * à partir de ce jour. La seule Pesée restante ne se supprime pas (`DernierePesee`) : le poids
 * du Profil est toujours celui d'une Pesée.
 */
export async function supprimerPesee(ctx: Contexte, jour: Jour): Promise<void> {
  await ctx.db.transaction(async (tx) => {
    const avant = await plusRecente(tx, ctx.userId);
    const supprimees = await tx
      .delete(pesee)
      .where(and(eq(pesee.userId, ctx.userId), eq(pesee.jour, jour)))
      .returning({ jour: pesee.jour });
    if (supprimees.length === 0) return;

    const precedente = await plusRecente(tx, ctx.userId);
    // Lever l'erreur annule la transaction, donc la suppression.
    if (!precedente) throw new DernierePesee();
    if (avant?.jour === jour) await appliquerPoids(tx, ctx.userId, jour, precedente.poidsKg);
  });
}

/** La clé d'un Objectif pour retenir un refus : « perdre:72 ». */
const cleObjectif = (o: Objectif) => (o.sens === "maintenir" ? o.sens : `${o.sens}:${o.poidsCibleKg}`);

/**
 * true quand le poids du Profil a atteint le Poids cible et que l'utilisateur n'a pas déjà
 * refusé de passer en « maintenir » pour cet Objectif.
 */
export async function propositionMaintien(ctx: Contexte): Promise<boolean> {
  const p = await lireProfil(ctx);
  if (!p || !poidsCibleAtteint(p.objectif, p.poidsKg)) return false;
  const [ligne] = await ctx.db
    .select({ refus: profil.maintienRefusePour })
    .from(profil)
    .where(eq(profil.userId, ctx.userId));
  return ligne?.refus !== cleObjectif(p.objectif);
}

/** Refuse de passer en « maintenir » : la proposition ne revient pas pour cet Objectif. */
export async function refuserMaintien(ctx: Contexte): Promise<void> {
  const p = await lireProfil(ctx);
  if (!p) return;
  await ctx.db
    .update(profil)
    .set({ maintienRefusePour: cleObjectif(p.objectif) })
    .where(eq(profil.userId, ctx.userId));
}

/** Accepte la proposition : l'Objectif passe en « maintenir » à partir d'aujourd'hui. */
export async function passerEnMaintien(ctx: Contexte, instant: Date = new Date()): Promise<void> {
  const p = await lireProfil(ctx);
  if (!p) return;
  await enregistrerProfil(ctx, { ...p, objectif: { sens: "maintenir" } }, instant);
}
