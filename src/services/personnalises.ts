import { and, asc, eq, inArray } from "drizzle-orm";
import { NUTRIMENTS_FACULTATIFS, normaliserRecherche, type Macros, type NutrimentsFacultatifs } from "@/core";
import { aliment, portion, type UniteAliment } from "@/db/schema";
import { estUuid, fichesAliments, type FicheAliment, type Portion } from "./aliments";
import type { Contexte } from "./contexte";

/**
 * La saisie d'un Aliment personnalisé : valeurs pour 100 g (ou 100 ml). Les kcal et les Macros
 * sont obligatoires, les autres nutriments facultatifs.
 */
export type SaisieAlimentPersonnalise = {
  nom: string;
  unite: UniteAliment;
  valeurs: Macros & Partial<NutrimentsFacultatifs>;
  /** Le Code-barres associé (8 à 14 chiffres), retrouvé ensuite au scan. Absent ou null : aucun. */
  codeBarres?: string | null;
};

const MACROS = ["kcal", "proteines", "glucides", "lipides"] as const;

export type ChampAlimentPersonnalise = "nom" | "unite" | "codeBarres" | keyof Macros | keyof NutrimentsFacultatifs;

/** La saisie d'un Aliment personnalisé est refusée : `champs` liste les champs invalides. */
export class SaisieAlimentInvalide extends Error {
  constructor(readonly champs: ChampAlimentPersonnalise[]) {
    super(`Aliment personnalisé invalide : ${champs.join(", ")}`);
    this.name = "SaisieAlimentInvalide";
  }
}

/** L'Aliment personnalisé n'existe pas, ou n'appartient pas à l'utilisateur. */
export class AlimentIntrouvable extends Error {
  constructor(readonly id: string) {
    super(`Aliment personnalisé introuvable : ${id}`);
    this.name = "AlimentIntrouvable";
  }
}

const MAX_NOM = 200;
/** Un Code-barres EAN-8, UPC-A, EAN-13 ou GTIN-14 ; vide pour n'en associer aucun. */
const CODE_BARRES = /^(\d{8,14})?$/;
/** Le maximum pour 100 g : 900 kcal (lipides purs, arrondis vers le haut), 100 g pour un nutriment. */
const maximum = (champ: keyof Macros | keyof NutrimentsFacultatifs) => (champ === "kcal" ? 1000 : 100);
const valeurValide = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;

/** Le nom nettoyé et les valeurs complétées, ou SaisieAlimentInvalide. */
function valider(saisie: SaisieAlimentPersonnalise) {
  const invalides: ChampAlimentPersonnalise[] = [];
  const nom = typeof saisie.nom === "string" ? saisie.nom.trim() : "";
  if (nom === "" || nom.length > MAX_NOM) invalides.push("nom");
  if (saisie.unite !== "g" && saisie.unite !== "ml") invalides.push("unite");
  const v = saisie.valeurs ?? ({} as SaisieAlimentPersonnalise["valeurs"]);
  for (const m of MACROS) if (!valeurValide(v[m], maximum(m))) invalides.push(m);
  for (const n of NUTRIMENTS_FACULTATIFS) {
    if (v[n] !== undefined && v[n] !== null && !valeurValide(v[n], maximum(n))) invalides.push(n);
  }
  const codeBarres = typeof saisie.codeBarres === "string" ? saisie.codeBarres.trim() : null;
  if (codeBarres !== null && !CODE_BARRES.test(codeBarres)) invalides.push("codeBarres");
  if (invalides.length > 0) throw new SaisieAlimentInvalide(invalides);
  return {
    nom,
    codeBarres: codeBarres === "" ? null : codeBarres,
    nomRecherche: normaliserRecherche(nom),
    unite: saisie.unite,
    kcal: v.kcal,
    proteines: v.proteines,
    glucides: v.glucides,
    lipides: v.lipides,
    fibres: v.fibres ?? null,
    sucres: v.sucres ?? null,
    satures: v.satures ?? null,
    sel: v.sel ?? null,
  };
}

const estAMoi = (ctx: Contexte) =>
  and(eq(aliment.type, "personnalise"), eq(aliment.proprietaireId, ctx.userId));

export async function creerAlimentPersonnalise(
  ctx: Contexte,
  saisie: SaisieAlimentPersonnalise,
): Promise<FicheAliment> {
  const [ligne] = await ctx.db
    .insert(aliment)
    .values({ type: "personnalise", proprietaireId: ctx.userId, ...valider(saisie) })
    .returning();
  const [fiche] = await fichesAliments(ctx.db, [ligne]);
  return fiche;
}

/** Les Aliments personnalisés de l'utilisateur, par ordre alphabétique. */
export async function listerAlimentsPersonnalises(ctx: Contexte): Promise<FicheAliment[]> {
  const lignes = await ctx.db.select().from(aliment).where(estAMoi(ctx)).orderBy(asc(aliment.nomRecherche));
  return fichesAliments(ctx.db, lignes);
}

/** Modifie un Aliment personnalisé. Les Entrées déjà notées gardent leur copie (ADR-0001). */
export async function modifierAlimentPersonnalise(
  ctx: Contexte,
  id: string,
  saisie: SaisieAlimentPersonnalise,
): Promise<FicheAliment> {
  const valeurs = valider(saisie);
  if (!estUuid(id)) throw new AlimentIntrouvable(id);
  const [ligne] = await ctx.db
    .update(aliment)
    .set({ ...valeurs, misAJour: new Date() })
    .where(and(eq(aliment.id, id), estAMoi(ctx)))
    .returning();
  if (!ligne) throw new AlimentIntrouvable(id);
  const [fiche] = await fichesAliments(ctx.db, [ligne]);
  return fiche;
}

/**
 * Supprime un Aliment personnalisé et ses Portions. Les Entrées notées avec lui restent, avec
 * leur copie des valeurs, et perdent seulement leur lien vers lui (ADR-0001).
 */
export async function supprimerAlimentPersonnalise(ctx: Contexte, id: string): Promise<void> {
  if (!estUuid(id)) throw new AlimentIntrouvable(id);
  const supprimes = await ctx.db
    .delete(aliment)
    .where(and(eq(aliment.id, id), estAMoi(ctx)))
    .returning({ id: aliment.id });
  if (supprimes.length === 0) throw new AlimentIntrouvable(id);
}

/** La saisie d'une Portion : son nom (« 1 bol ») et son poids en g (ou son volume en ml). */
export type SaisiePortion = { nom: string; grammes: number };
export type ChampPortion = keyof SaisiePortion;

export class SaisiePortionInvalide extends Error {
  constructor(readonly champs: ChampPortion[]) {
    super(`Portion invalide : ${champs.join(", ")}`);
    this.name = "SaisiePortionInvalide";
  }
}

/** La Portion n'existe pas, ou n'est pas celle d'un Aliment personnalisé de l'utilisateur. */
export class PortionIntrouvable extends Error {
  constructor(readonly id: string) {
    super(`Portion introuvable : ${id}`);
    this.name = "PortionIntrouvable";
  }
}

function validerPortion(saisie: SaisiePortion) {
  const invalides: ChampPortion[] = [];
  const nom = typeof saisie.nom === "string" ? saisie.nom.trim() : "";
  if (nom === "" || nom.length > MAX_NOM) invalides.push("nom");
  if (!(typeof saisie.grammes === "number" && Number.isFinite(saisie.grammes) && saisie.grammes > 0 && saisie.grammes <= 100_000)) {
    invalides.push("grammes");
  }
  if (invalides.length > 0) throw new SaisiePortionInvalide(invalides);
  return { nom, grammes: saisie.grammes };
}

const versPortion = (p: typeof portion.$inferSelect): Portion => ({ id: p.id, nom: p.nom, grammes: p.grammes });

/** Les Portions modifiables par l'utilisateur : celles de ses Aliments personnalisés. */
const portionAMoi = (ctx: Contexte, id: string) =>
  and(eq(portion.id, id), inArray(portion.alimentId, ctx.db.select({ id: aliment.id }).from(aliment).where(estAMoi(ctx))));

/** Ajoute une Portion à un Aliment personnalisé de l'utilisateur. */
export async function ajouterPortion(ctx: Contexte, alimentId: string, saisie: SaisiePortion): Promise<Portion> {
  const valeurs = validerPortion(saisie);
  if (!estUuid(alimentId)) throw new AlimentIntrouvable(alimentId);
  const [a] = await ctx.db
    .select({ id: aliment.id })
    .from(aliment)
    .where(and(eq(aliment.id, alimentId), estAMoi(ctx)));
  if (!a) throw new AlimentIntrouvable(alimentId);
  const [ligne] = await ctx.db.insert(portion).values({ alimentId, ...valeurs }).returning();
  return versPortion(ligne);
}

/** Modifie une Portion. Les Entrées déjà notées gardent la copie de son nom et de son poids. */
export async function modifierPortion(ctx: Contexte, id: string, saisie: SaisiePortion): Promise<Portion> {
  const valeurs = validerPortion(saisie);
  if (!estUuid(id)) throw new PortionIntrouvable(id);
  const [ligne] = await ctx.db.update(portion).set(valeurs).where(portionAMoi(ctx, id)).returning();
  if (!ligne) throw new PortionIntrouvable(id);
  return versPortion(ligne);
}

export async function supprimerPortion(ctx: Contexte, id: string): Promise<void> {
  if (!estUuid(id)) throw new PortionIntrouvable(id);
  const supprimees = await ctx.db.delete(portion).where(portionAMoi(ctx, id)).returning({ id: portion.id });
  if (supprimees.length === 0) throw new PortionIntrouvable(id);
}
