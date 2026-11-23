import { and, asc, eq } from "drizzle-orm";
import {
  estJourValide,
  jourCalendaire,
  quantiteEnGrammes,
  REPAS,
  resteDuJour,
  totauxDuJour,
  valeursEntree,
  type Jour,
  type Macros,
  type ObjectifCalcule,
  type Quantite,
  type Repas,
  type ValeursNutritionnelles,
} from "@/core";
import { entree as tableEntree, portion as tablePortion, profil } from "@/db/schema";
import { estUuid, lireAliment } from "./aliments";
import { SaisieInvalide } from "./saisie-invalide";
import type { Contexte } from "./contexte";
import { objectifDuJour } from "./profil";

/**
 * Une quantité saisie pour une Entrée : en g, en ml, ou en nombre de Portions de l'Aliment.
 * Le service résout la Portion en `Quantite` du noyau, qui la convertit en grammes.
 */
export type QuantiteSaisie =
  | { unite: "g" | "ml"; valeur: number }
  | { unite: "portion"; portionId: string; nombre: number };

/**
 * La quantité d'une Entrée notée. En Portions, elle garde une copie du nom et du poids de la
 * Portion au moment de la saisie (ADR-0001) ; `portionId` devient null si la Portion est supprimée.
 */
export type QuantiteEntree =
  | { unite: "g" | "ml"; valeur: number }
  | { unite: "portion"; portionId: string | null; nombre: number; nom: string; grammesParPortion: number };

/** Une Entrée du Journal, avec la copie de ses valeurs pour 100 g et ses valeurs pour sa quantité. */
export type Entree = {
  id: string;
  jour: Jour;
  repas: Repas;
  /** L'Aliment d'origine, null s'il n'existe plus (ADR-0001). */
  alimentId: string | null;
  nom: string;
  marque: string | null;
  quantite: QuantiteEntree;
  grammes: number;
  pour100g: ValeursNutritionnelles;
  valeurs: ValeursNutritionnelles;
};

export type JournalDuJour = {
  jour: Jour;
  repas: { repas: Repas; entrees: Entree[]; total: Macros }[];
  total: Macros;
  /** L'Objectif calorique et les cibles de Macros en vigueur ce jour-là (null avant le Profil). */
  objectif: ObjectifCalcule | null;
  /** Ce qu'il reste par rapport à l'objectif du jour (null sans objectif). */
  reste: Macros | null;
};

export type ChampEntree = "jour" | "repas" | "aliment" | "quantite";

export class SaisieEntreeInvalide extends SaisieInvalide<ChampEntree> {
  constructor(champs: ChampEntree[]) {
    super("Entrée", champs);
  }
}

/** Une Entrée ne peut pas être notée sur un jour postérieur à aujourd'hui (fuseau du Profil). */
export class JourFutur extends Error {
  constructor(
    readonly jour: Jour,
    readonly aujourdhui: Jour,
  ) {
    super(`Le ${jour} est un jour futur (aujourd'hui : ${aujourdhui}).`);
    this.name = "JourFutur";
  }
}

export class EntreeIntrouvable extends Error {
  constructor(readonly id: string) {
    super(`Entrée introuvable : ${id}`);
    this.name = "EntreeIntrouvable";
  }
}

type LigneEntree = typeof tableEntree.$inferSelect;

export function versEntree(l: LigneEntree): Entree {
  const pour100g: ValeursNutritionnelles = {
    kcal: l.kcal,
    proteines: l.proteines,
    glucides: l.glucides,
    lipides: l.lipides,
    fibres: l.fibres,
    sucres: l.sucres,
    satures: l.satures,
    sel: l.sel,
  };
  return {
    id: l.id,
    jour: l.jour,
    repas: l.repas,
    alimentId: l.alimentId,
    nom: l.nom,
    marque: l.marque,
    quantite:
      l.unite === "portion"
        ? {
            unite: "portion",
            portionId: l.portionId,
            nombre: l.quantite,
            nom: l.portionNom ?? "",
            grammesParPortion: l.grammesParPortion ?? l.grammes / l.quantite,
          }
        : { unite: l.unite, valeur: l.quantite },
    grammes: l.grammes,
    pour100g,
    valeurs: valeursEntree(pour100g, l.grammes),
  };
}

export async function lireJournal(ctx: Contexte, jour: Jour): Promise<JournalDuJour> {
  const lignes = await ctx.db
    .select()
    .from(tableEntree)
    .where(and(eq(tableEntree.userId, ctx.userId), eq(tableEntree.jour, jour)))
    .orderBy(asc(tableEntree.creeLe), asc(tableEntree.id));
  const entrees = lignes.map(versEntree);
  const totaux = totauxDuJour(entrees);
  const objectif = await objectifDuJour(ctx, jour);
  return {
    jour,
    repas: REPAS.map((repas) => ({
      repas,
      entrees: entrees.filter((e) => e.repas === repas),
      total: totaux.parRepas[repas],
    })),
    total: totaux.jour,
    objectif,
    reste: objectif ? resteDuJour(objectif, totaux.jour) : null,
  };
}

const nombreValide = (n: unknown, max: number): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0 && n <= max;

function quantiteValide(q: QuantiteSaisie | undefined): q is QuantiteSaisie {
  if (!q) return false;
  if (q.unite === "portion") return estUuid(q.portionId) && nombreValide(q.nombre, 1000);
  return (q.unite === "g" || q.unite === "ml") && nombreValide(q.valeur, 100_000);
}

/** Les colonnes de la quantité d'une Entrée : la Portion est cherchée parmi celles de l'Aliment. */
type ColonnesQuantite = Pick<
  LigneEntree,
  "quantite" | "unite" | "grammes" | "portionId" | "portionNom" | "grammesParPortion"
>;

async function colonnesQuantite(
  ctx: Contexte,
  alimentId: string | null,
  q: QuantiteSaisie,
): Promise<ColonnesQuantite | null> {
  if (q.unite !== "portion") {
    return { quantite: q.valeur, unite: q.unite, grammes: quantiteEnGrammes(q), portionId: null, portionNom: null, grammesParPortion: null };
  }
  if (!alimentId) return null;
  const [p] = await ctx.db
    .select()
    .from(tablePortion)
    .where(and(eq(tablePortion.id, q.portionId), eq(tablePortion.alimentId, alimentId)));
  if (!p) return null;
  const quantite: Quantite = { unite: "portion", nombre: q.nombre, grammesParPortion: p.grammes };
  return {
    quantite: q.nombre,
    unite: "portion",
    grammes: quantiteEnGrammes(quantite),
    portionId: p.id,
    portionNom: p.nom,
    grammesParPortion: p.grammes,
  };
}

const repasValide = (r: unknown): r is Repas => REPAS.includes(r as Repas);

/** Aujourd'hui pour l'utilisateur, dans le fuseau de son Profil. */
async function aujourdhui(ctx: Contexte, instant: Date): Promise<Jour> {
  const [p] = await ctx.db.select({ fuseau: profil.fuseau }).from(profil).where(eq(profil.userId, ctx.userId));
  return jourCalendaire(instant, p?.fuseau ?? "UTC");
}

export type SaisieEntree = { jour: Jour; repas: Repas; alimentId: string; quantite: QuantiteSaisie };

/**
 * Ajoute une Entrée au Journal, avec une copie du nom, de la marque et des valeurs pour 100 g
 * de l'Aliment (ADR-0001). Refuse un jour futur dans le fuseau de l'utilisateur.
 */
export async function ajouterEntree(ctx: Contexte, saisie: SaisieEntree, instant: Date = new Date()): Promise<Entree> {
  const invalides: ChampEntree[] = [];
  if (!estJourValide(saisie.jour)) invalides.push("jour");
  if (!repasValide(saisie.repas)) invalides.push("repas");
  if (!quantiteValide(saisie.quantite)) invalides.push("quantite");
  const aliment = await lireAliment(ctx, saisie.alimentId);
  if (!aliment) invalides.push("aliment");
  const quantite =
    aliment && invalides.length === 0 ? await colonnesQuantite(ctx, aliment.id, saisie.quantite) : null;
  if (aliment && invalides.length === 0 && !quantite) invalides.push("quantite");
  if (invalides.length > 0 || !aliment || !quantite) throw new SaisieEntreeInvalide(invalides);

  const auj = await aujourdhui(ctx, instant);
  if (saisie.jour > auj) throw new JourFutur(saisie.jour, auj);

  const [ligne] = await ctx.db
    .insert(tableEntree)
    .values({
      userId: ctx.userId,
      jour: saisie.jour,
      repas: saisie.repas,
      alimentId: aliment.id,
      ...quantite,
      nom: aliment.nom,
      marque: aliment.marque,
      ...aliment.valeurs,
    })
    .returning();
  return versEntree(ligne);
}

/** Modifie la quantité ou le Repas d'une Entrée. Ses valeurs pour 100 g restent la copie d'origine. */
export async function modifierEntree(
  ctx: Contexte,
  id: string,
  modif: { quantite?: QuantiteSaisie; repas?: Repas },
): Promise<Entree> {
  const invalides: ChampEntree[] = [];
  if (modif.repas !== undefined && !repasValide(modif.repas)) invalides.push("repas");
  if (modif.quantite !== undefined && !quantiteValide(modif.quantite)) invalides.push("quantite");
  if (invalides.length > 0) throw new SaisieEntreeInvalide(invalides);
  if (!estUuid(id)) throw new EntreeIntrouvable(id);

  let quantite: ColonnesQuantite | null = null;
  if (modif.quantite) {
    const actuelle = await lireEntree(ctx, id);
    if (!actuelle) throw new EntreeIntrouvable(id);
    quantite = await colonnesQuantite(ctx, actuelle.alimentId, modif.quantite);
    if (!quantite) throw new SaisieEntreeInvalide(["quantite"]);
  }

  const [ligne] = await ctx.db
    .update(tableEntree)
    .set({ ...(modif.repas && { repas: modif.repas }), ...quantite })
    .where(and(eq(tableEntree.id, id), eq(tableEntree.userId, ctx.userId)))
    .returning();
  if (!ligne) throw new EntreeIntrouvable(id);
  return versEntree(ligne);
}

export async function supprimerEntree(ctx: Contexte, id: string): Promise<void> {
  if (!estUuid(id)) throw new EntreeIntrouvable(id);
  const supprimees = await ctx.db
    .delete(tableEntree)
    .where(and(eq(tableEntree.id, id), eq(tableEntree.userId, ctx.userId)))
    .returning({ id: tableEntree.id });
  if (supprimees.length === 0) throw new EntreeIntrouvable(id);
}

/** Une Entrée de l'utilisateur, ou null. */
export async function lireEntree(ctx: Contexte, id: string): Promise<Entree | null> {
  if (!estUuid(id)) return null;
  const [ligne] = await ctx.db
    .select()
    .from(tableEntree)
    .where(and(eq(tableEntree.id, id), eq(tableEntree.userId, ctx.userId)));
  return ligne ? versEntree(ligne) : null;
}
