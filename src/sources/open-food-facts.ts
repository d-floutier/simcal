import { kcalDepuisKj, normaliserRecherche } from "@/core";
import type { ProduitOff, UniteAliment } from "@/db/schema";

export type { ProduitOff };

/**
 * Ce que Simcal demande à Open Food Facts : chercher par texte, lire un produit par Code-barres.
 * Les deux ne renvoient que des produits vendus en France. Une erreur (panne, délai dépassé)
 * est levée : c'est à l'appelant de l'ignorer.
 */
export interface ClientOpenFoodFacts {
  chercher(texte: string): Promise<ProduitOff[]>;
  lireProduit(code: string): Promise<ProduitOff | null>;
}

/** Un User-Agent générique propre à Simcal, sans aucune donnée personnelle. */
export const USER_AGENT = "Simcal/0.1 (+https://github.com/d-floutier/simcal)";

const RECHERCHE = "https://search.openfoodfacts.org/search";
const PRODUIT = "https://world.openfoodfacts.org/api/v2/product/";
const CHAMPS = [
  "code",
  "product_name",
  "product_name_fr",
  "brands",
  "countries_tags",
  "nutriments",
  "serving_size",
  "serving_quantity",
  "serving_quantity_unit",
  "product_quantity_unit",
].join(",");
const TAILLE_PAGE = 20;
export const DELAI_PAR_DEFAUT_MS = 2500;
const CODE_BARRES = /^\d{8,14}$/;

/** Le client HTTP d'Open Food Facts. `fetch` est remplaçable pour les tests (aucun appel réseau). */
export function clientOpenFoodFacts(
  opts: { fetch?: typeof fetch; delaiMs?: number } = {},
): ClientOpenFoodFacts {
  const f = opts.fetch ?? fetch;
  const delaiMs = opts.delaiMs ?? DELAI_PAR_DEFAUT_MS;

  async function lireJson(url: URL): Promise<{ status: number; corps: unknown }> {
    const signal = AbortSignal.timeout(delaiMs);
    const requete = f(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal, cache: "no-store" })
      .then(async (r) => ({ status: r.status, corps: r.ok || r.status === 404 ? await r.json() : null }));
    // Abandonne même si `fetch` ignore le signal.
    const delai = new Promise<never>((_, rejeter) =>
      signal.addEventListener("abort", () => rejeter(new Error(`Open Food Facts : délai de ${delaiMs} ms dépassé`))),
    );
    const resultat = await Promise.race([requete, delai]);
    if (resultat.status !== 404 && resultat.corps === null) {
      throw new Error(`Open Food Facts : réponse ${resultat.status}`);
    }
    return resultat;
  }

  return {
    async chercher(texte) {
      const mots = normaliserRecherche(texte);
      if (mots === "") return [];
      const url = new URL(RECHERCHE);
      // Le texte normalisé n'a plus de syntaxe Lucene : seul le filtre France s'y ajoute.
      url.searchParams.set("q", `${mots} countries_tags:"en:france"`);
      url.searchParams.set("langs", "fr");
      url.searchParams.set("page_size", String(TAILLE_PAGE));
      url.searchParams.set("fields", CHAMPS);
      const { corps } = await lireJson(url);
      const hits = (corps as { hits?: unknown[] } | null)?.hits ?? [];
      return hits.map(lireProduitOff).filter((p): p is ProduitOff => p !== null);
    },
    async lireProduit(code) {
      if (!CODE_BARRES.test(code)) return null;
      const url = new URL(PRODUIT + code);
      url.searchParams.set("fields", CHAMPS);
      const { status, corps } = await lireJson(url);
      const r = corps as { status?: number; product?: unknown } | null;
      if (status === 404 || r?.status !== 1 || !r.product) return null;
      return lireProduitOff({ code, ...(r.product as object) });
    },
  };
}

type ProduitBrut = {
  code?: unknown;
  product_name?: unknown;
  product_name_fr?: unknown;
  brands?: unknown;
  countries_tags?: unknown;
  nutriments?: Record<string, unknown>;
  serving_size?: unknown;
  serving_quantity?: unknown;
  serving_quantity_unit?: unknown;
  product_quantity_unit?: unknown;
};

const nombre = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
};
const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
// Les valeurs d'Open Food Facts ont souvent du bruit de flottant (4.5999999046326).
const arrondir = (v: number) => Math.round(v * 1e4) / 1e4;

/**
 * Lit un produit d'Open Food Facts (recherche ou lecture par Code-barres). Null s'il n'est pas
 * vendu en France, ou s'il n'a pas de nom, de kcal (ou de kJ) et de Macros.
 */
export function lireProduitOff(brut: unknown): ProduitOff | null {
  const p = (brut ?? {}) as ProduitBrut;
  const code = texte(p.code);
  const nom = texte(p.product_name_fr) || texte(p.product_name);
  const pays = Array.isArray(p.countries_tags) ? p.countries_tags : [];
  if (!code || !nom || !pays.includes("en:france")) return null;

  const n = p.nutriments ?? {};
  const grammesPortion = nombre(p.serving_quantity);
  // Une valeur pour 100 g, ou à défaut calculée depuis la valeur par portion.
  const pour100 = (cle: string): number | null => {
    const v = nombre(n[`${cle}_100g`]);
    if (v !== null) return v;
    const parPortion = nombre(n[`${cle}_serving`]);
    return parPortion !== null && grammesPortion ? (parPortion * 100) / grammesPortion : null;
  };
  const kj = pour100("energy-kj") ?? pour100("energy");
  const kcal = pour100("energy-kcal") ?? (kj === null ? null : kcalDepuisKj(kj));
  const proteines = pour100("proteins");
  const glucides = pour100("carbohydrates");
  const lipides = pour100("fat");
  if (kcal === null || proteines === null || glucides === null || lipides === null) return null;
  const facultatif = (cle: string) => {
    const v = pour100(cle);
    return v === null ? null : arrondir(v);
  };

  const brands = Array.isArray(p.brands) ? p.brands.map(texte) : texte(p.brands).split(",").map((b) => b.trim());
  const unite: UniteAliment = p.product_quantity_unit === "ml" || p.serving_quantity_unit === "ml" ? "ml" : "g";

  return {
    code,
    nom,
    marque: brands.find(Boolean) ?? null,
    unite,
    valeurs: {
      kcal: arrondir(kcal),
      proteines: arrondir(proteines),
      glucides: arrondir(glucides),
      lipides: arrondir(lipides),
      fibres: facultatif("fiber"),
      sucres: facultatif("sugars"),
      satures: facultatif("saturated-fat"),
      sel: facultatif("salt"),
    },
    portions: grammesPortion ? [{ nom: nomPortion(texte(p.serving_size)), grammes: arrondir(grammesPortion) }] : [],
  };
}

/** « 1 verre (250 ml) » → « 1 verre » ; « 15 g » → « 1 portion ». */
function nomPortion(servingSize: string): string {
  const nom = servingSize
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|mg|kg|ml|cl|dl|l)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return /\p{L}/u.test(nom) ? nom : "1 portion";
}
