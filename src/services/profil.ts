import { and, desc, eq, lte } from "drizzle-orm";
import {
  age,
  calculerObjectif,
  NIVEAUX_ACTIVITE,
  RYTHMES,
  totalRepartition,
  jourCalendaire,
  type Jour,
  type NiveauActivite,
  type Objectif,
  type ObjectifCalcule,
  type ParametresObjectif,
  type Repartition,
  type Rythme,
  type Sexe,
} from "@/core";
import { objectifHistorique, profil } from "@/db/schema";
import type { Contexte } from "./contexte";

/** Le Profil, l'Objectif et la Répartition des macros, tels que saisis dans les réglages. */
export type SaisieProfil = {
  sexe: Sexe;
  dateNaissance: Jour;
  tailleCm: number;
  poidsKg: number;
  niveauActivite: NiveauActivite;
  /** Fuseau IANA (par exemple « Europe/Paris ») : il fixe le jour de l'utilisateur. */
  fuseau: string;
  objectif: Objectif;
  repartition: Repartition;
};

type LigneParametres = typeof objectifHistorique.$inferSelect;

export function versParametres(l: Omit<LigneParametres, "userId" | "depuis">): ParametresObjectif {
  const objectif: Objectif =
    l.sens === "maintenir"
      ? { sens: "maintenir" }
      : { sens: l.sens, poidsCibleKg: l.poidsCibleKg!, rythme: l.rythme as Rythme };
  return {
    sexe: l.sexe,
    dateNaissance: l.dateNaissance,
    tailleCm: l.tailleCm,
    poidsKg: l.poidsKg,
    niveauActivite: l.niveauActivite,
    objectif,
    repartition: { glucides: l.glucidesPct, proteines: l.proteinesPct, lipides: l.lipidesPct },
  };
}

/** Le Profil courant, ou null tant que la première configuration n'est pas faite. */
export async function lireProfil(ctx: Contexte): Promise<SaisieProfil | null> {
  const [ligne] = await ctx.db.select().from(profil).where(eq(profil.userId, ctx.userId));
  if (!ligne) return null;
  return { ...versParametres(ligne), fuseau: ligne.fuseau };
}

/**
 * L'Objectif calorique et les cibles de Macros en vigueur le jour donné : le dernier objectif
 * enregistré à cette date ou avant, avec l'âge atteint ce jour-là. Null avant le premier.
 */
export async function objectifDuJour(ctx: Contexte, jour: Jour): Promise<ObjectifCalcule | null> {
  const [ligne] = await ctx.db
    .select()
    .from(objectifHistorique)
    .where(and(eq(objectifHistorique.userId, ctx.userId), lte(objectifHistorique.depuis, jour)))
    .orderBy(desc(objectifHistorique.depuis))
    .limit(1);
  return ligne ? calculerObjectif(versParametres(ligne), jour) : null;
}

export function versLigne(p: ParametresObjectif) {
  return {
    sexe: p.sexe,
    dateNaissance: p.dateNaissance,
    tailleCm: p.tailleCm,
    poidsKg: p.poidsKg,
    niveauActivite: p.niveauActivite,
    sens: p.objectif.sens,
    poidsCibleKg: p.objectif.sens === "maintenir" ? null : p.objectif.poidsCibleKg,
    rythme: p.objectif.sens === "maintenir" ? null : p.objectif.rythme,
    glucidesPct: p.repartition.glucides,
    proteinesPct: p.repartition.proteines,
    lipidesPct: p.repartition.lipides,
  };
}

export type ChampProfil =
  | "sexe"
  | "dateNaissance"
  | "tailleCm"
  | "poidsKg"
  | "niveauActivite"
  | "fuseau"
  | "sens"
  | "poidsCibleKg"
  | "rythme"
  | "repartition";

/** La saisie est refusée : `champs` liste les champs invalides, dans l'ordre du formulaire. */
export class SaisieProfilInvalide extends Error {
  constructor(readonly champs: ChampProfil[]) {
    super(`Profil invalide : ${champs.join(", ")}`);
    this.name = "SaisieProfilInvalide";
  }
}

const entre = (x: number, min: number, max: number) => Number.isFinite(x) && x >= min && x <= max;

export function dateValide(jour: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return false;
  const d = new Date(`${jour}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(jour);
}

function fuseauValide(fuseau: string): boolean {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
    return fuseau.length > 0;
  } catch {
    return false;
  }
}

function champsInvalides(s: SaisieProfil, jour: Jour): ChampProfil[] {
  const invalides: ChampProfil[] = [];
  if (s.sexe !== "homme" && s.sexe !== "femme") invalides.push("sexe");
  if (!dateValide(s.dateNaissance) || s.dateNaissance >= jour || age(s.dateNaissance, jour) > 120) {
    invalides.push("dateNaissance");
  }
  if (!entre(s.tailleCm, 50, 272)) invalides.push("tailleCm");
  if (!entre(s.poidsKg, 20, 500)) invalides.push("poidsKg");
  if (!NIVEAUX_ACTIVITE.includes(s.niveauActivite)) invalides.push("niveauActivite");
  if (!fuseauValide(s.fuseau)) invalides.push("fuseau");
  const o = s.objectif;
  if (o.sens !== "maintenir" && o.sens !== "perdre" && o.sens !== "prendre") invalides.push("sens");
  if (o.sens === "perdre" || o.sens === "prendre") {
    if (!entre(o.poidsCibleKg, 20, 500)) invalides.push("poidsCibleKg");
    if (!RYTHMES.includes(o.rythme)) invalides.push("rythme");
  }
  const r = s.repartition;
  const parts = [r.glucides, r.proteines, r.lipides];
  if (!parts.every((x) => entre(x, 0, 100)) || Math.abs(totalRepartition(r) - 100) > 1e-9) {
    invalides.push("repartition");
  }
  return invalides;
}

/**
 * Enregistre le Profil, l'Objectif et la Répartition, et un nouvel objectif valable à partir
 * d'aujourd'hui (dans le fuseau saisi). Les jours passés gardent le leur.
 */
export async function enregistrerProfil(
  ctx: Contexte,
  saisie: SaisieProfil,
  instant: Date = new Date(),
): Promise<{ jour: Jour; objectif: ObjectifCalcule }> {
  const { fuseau, ...parametres } = saisie;
  const jour = fuseauValide(fuseau) ? jourCalendaire(instant, fuseau) : instant.toISOString().slice(0, 10);
  const invalides = champsInvalides(saisie, jour);
  if (invalides.length > 0) throw new SaisieProfilInvalide(invalides);
  const objectif = calculerObjectif(parametres, jour);
  const ligne = versLigne(parametres);
  await ctx.db.transaction(async (tx) => {
    // L'Objectif d'hydratation n'est pas saisi ici : la nouvelle ligne d'historique reporte le courant.
    const [courant] = await tx
      .select({ objectifHydratationMl: profil.objectifHydratationMl })
      .from(profil)
      .where(eq(profil.userId, ctx.userId));
    await tx
      .insert(profil)
      .values({ userId: ctx.userId, fuseau, ...ligne })
      .onConflictDoUpdate({ target: profil.userId, set: { fuseau, ...ligne, misAJour: new Date() } });
    await tx
      .insert(objectifHistorique)
      .values({ userId: ctx.userId, depuis: jour, ...ligne, ...courant })
      .onConflictDoUpdate({ target: [objectifHistorique.userId, objectifHistorique.depuis], set: ligne });
  });
  return { jour, objectif };
}
