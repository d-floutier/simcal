import { and, asc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import type { ValeursNutritionnelles } from "@/core";
import type { Db } from "@/db/client";
import { aliment, portion, type TypeAliment, type UniteAliment } from "@/db/schema";
import { sourceCiqual } from "@/sources/ciqual";
import { clientOpenFoodFacts, type ClientOpenFoodFacts } from "@/sources/open-food-facts";
import { fauxOpenFoodFacts } from "@/sources/open-food-facts-faux";
import { sourcePersonnalises } from "@/sources/personnalises";
import { codeProduitAGarder, sourceOpenFoodFacts, sourceProduitsGardes } from "@/sources/produits";
import type { AlimentResume, SourceAliments } from "@/sources/source";
import type { Contexte } from "./contexte";
import { lireRecents } from "./recents";

export type { AlimentResume, SourceAliments };

/** Une Portion d'un Aliment : `grammes` est le poids (ou le volume) d'une Portion. */
export type Portion = { id: string; nom: string; grammes: number };

/**
 * La fiche d'un Aliment : ses valeurs pour 100 g (ou 100 ml), nutriments facultatifs compris,
 * son Code-barres éventuel et ses Portions.
 */
export type FicheAliment = {
  id: string;
  type: TypeAliment;
  nom: string;
  marque: string | null;
  unite: UniteAliment;
  codeBarres: string | null;
  valeurs: ValeursNutritionnelles;
  portions: Portion[];
};

type LigneAliment = typeof aliment.$inferSelect;

/** Les fiches de ces lignes d'Aliments, avec leurs Portions de la plus petite à la plus grande. */
export async function fichesAliments(db: Db, lignes: LigneAliment[]): Promise<FicheAliment[]> {
  const ids = lignes.map((a) => a.id);
  const portions =
    ids.length === 0
      ? []
      : await db
          .select()
          .from(portion)
          .where(inArray(portion.alimentId, ids))
          .orderBy(asc(portion.grammes), asc(portion.nom), asc(portion.id));
  return lignes.map((a) => ({
    id: a.id,
    type: a.type,
    nom: a.nom,
    marque: a.marque,
    unite: a.unite,
    codeBarres: a.codeBarres,
    valeurs: {
      kcal: a.kcal,
      proteines: a.proteines,
      glucides: a.glucides,
      lipides: a.lipides,
      fibres: a.fibres,
      sucres: a.sucres,
      satures: a.satures,
      sel: a.sel,
    },
    portions: portions
      .filter((p) => p.alimentId === a.id)
      .map((p) => ({ id: p.id, nom: p.nom, grammes: p.grammes })),
  }));
}

/**
 * Le client Open Food Facts de l'app. SIMCAL_OPEN_FOOD_FACTS=faux le remplace par la fausse
 * source (tests Vitest et parcours e2e : aucun appel réseau).
 */
export function openFoodFactsParDefaut(): ClientOpenFoodFacts {
  return process.env.SIMCAL_OPEN_FOOD_FACTS === "faux" ? fauxOpenFoodFacts() : clientOpenFoodFacts();
}

/**
 * Les sources, dans l'ordre où leurs résultats sont présentés : Aliments personnalisés,
 * génériques, puis Produits (ceux déjà gardés en base, puis ceux d'Open Food Facts).
 * C'est aussi l'ordre de priorité pour trouver un Code-barres.
 */
export function sourcesParDefaut(
  ctx: Contexte,
  { openFoodFacts = openFoodFactsParDefaut() }: { openFoodFacts?: ClientOpenFoodFacts } = {},
): SourceAliments[] {
  return [
    sourcePersonnalises(ctx.db, ctx.userId),
    sourceCiqual(ctx.db),
    sourceProduitsGardes(ctx.db),
    sourceOpenFoodFacts(ctx.db, openFoodFacts),
  ];
}

/**
 * Garde en base le Produit d'un résultat de recherche Open Food Facts pas encore gardé
 * (identifiant `off-<Code-barres>`), avec ses Portions, pour pouvoir le noter. Renvoie le
 * Produit gardé (déjà gardé : le même), ou null si l'identifiant est inconnu ou qu'Open Food
 * Facts ne répond pas.
 */
export async function garderProduit(
  ctx: Contexte,
  id: string,
  openFoodFacts: ClientOpenFoodFacts = openFoodFactsParDefaut(),
): Promise<AlimentResume | null> {
  const code = codeProduitAGarder(id);
  if (!code) return null;
  try {
    return await sourceOpenFoodFacts(ctx.db, openFoodFacts).trouverParCodeBarres(code);
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Cherche des Aliments : d'abord les Récents qui correspondent, puis chaque source, dans
 * l'ordre des sources, sans doublons.
 * Une source en erreur est ignorée : les autres résultats s'affichent quand même.
 */
export async function chercherAliments(
  ctx: Contexte,
  texte: string,
  sources: SourceAliments[] = sourcesParDefaut(ctx),
): Promise<AlimentResume[]> {
  if (texte.trim() === "") return [];
  const parSource = await Promise.all(
    sources.map((s) =>
      s.chercher(texte).catch((e) => {
        console.error(e);
        return [] as AlimentResume[];
      }),
    ),
  );
  const recents = (await lireRecents(ctx, texte)).map((r) => r.aliment);
  const vus = new Set<string>();
  return [recents, ...parSource].flat().filter((a) => !vus.has(a.id) && vus.add(a.id));
}

/**
 * Le résultat de la recherche d'un Code-barres : l'Aliment trouvé, ou le code introuvable,
 * pour que l'interface propose de créer un Aliment personnalisé lié à ce code.
 * `invalide` : ce n'est pas un Code-barres (8 à 14 chiffres). `horsService` : une source n'a
 * pas répondu, le code existe peut-être.
 */
export type ResultatCodeBarres =
  | { trouve: true; aliment: AlimentResume }
  | { trouve: false; code: string; invalide?: true; horsService?: true };

const CODE_BARRES = /^\d{8,14}$/;

/**
 * Trouve un Aliment par son Code-barres : le premier trouvé dans l'ordre des sources
 * (Aliment personnalisé lié au code, puis Produit gardé en base, puis Open Food Facts, qui ne
 * reçoit que le code). Les espaces tapés dans le code sont ignorés.
 */
export async function trouverParCodeBarres(
  ctx: Contexte,
  saisie: string,
  sources: SourceAliments[] = sourcesParDefaut(ctx),
): Promise<ResultatCodeBarres> {
  const code = saisie.replace(/\s/g, "");
  if (!CODE_BARRES.test(code)) return { trouve: false, code: saisie, invalide: true };
  let horsService = false;
  for (const source of sources) {
    try {
      const aliment = await source.trouverParCodeBarres(code);
      if (aliment) return { trouve: true, aliment };
    } catch (e) {
      console.error(e);
      horsService = true;
    }
  }
  return horsService ? { trouve: false, code, horsService: true } : { trouve: false, code };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUuid = (id: string) => UUID.test(id);

/** Un Aliment visible par l'utilisateur : partagé, ou personnalisé et à lui. Null sinon. */
export async function lireAliment(ctx: Contexte, id: string): Promise<FicheAliment | null> {
  if (!estUuid(id)) return null;
  const [a] = await ctx.db
    .select()
    .from(aliment)
    .where(
      and(
        eq(aliment.id, id),
        or(ne(aliment.type, "personnalise"), eq(aliment.proprietaireId, ctx.userId)),
        or(isNull(aliment.proprietaireId), eq(aliment.proprietaireId, ctx.userId)),
      ),
    );
  if (!a) return null;
  const [fiche] = await fichesAliments(ctx.db, [a]);
  return fiche;
}
