import { describe, expect, it } from "vitest";
import { clientOpenFoodFacts, USER_AGENT } from "./open-food-facts";

// Aucun appel réseau : `fetch` est remplacé par une fonction qui répond comme Open Food Facts.
type Appel = { url: URL; init?: RequestInit };
function fauxFetch(reponse: (url: URL) => Response | Promise<Response>) {
  const appels: Appel[] = [];
  const f = (async (entree: string | URL | Request, init?: RequestInit) => {
    const url = new URL(entree.toString());
    appels.push({ url, init });
    return reponse(url);
  }) as typeof fetch;
  return { fetch: f, appels };
}
const json = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { "content-type": "application/json" } });

const NUTELLA = {
  code: "3017624010701",
  product_name: "Nutella",
  brands: ["Nutella", "Ferrero"],
  countries_tags: ["en:france", "en:belgium"],
  serving_size: "15 g",
  serving_quantity: 15,
  product_quantity_unit: "g",
  nutriments: {
    "energy-kcal_100g": 539,
    "energy-kj_100g": 2252,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
    sugars_100g: 56.3,
    "saturated-fat_100g": 10.6,
    salt_100g: 0.107,
  },
};

describe("client Open Food Facts : recherche", () => {
  it("ramène chaque produit à ses valeurs pour 100 g, avec sa marque et sa Portion", async () => {
    const { fetch } = fauxFetch(() => json({ hits: [NUTELLA] }));
    const produits = await clientOpenFoodFacts({ fetch }).chercher("nutella");
    expect(produits).toEqual([
      {
        code: "3017624010701",
        nom: "Nutella",
        marque: "Nutella",
        unite: "g",
        valeurs: { kcal: 539, proteines: 6.3, glucides: 57.5, lipides: 30.9, fibres: null, sucres: 56.3, satures: 10.6, sel: 0.107 },
        portions: [{ nom: "1 portion", grammes: 15 }],
      },
    ]);
  });

  it("ne garde que les produits vendus en France, et le demande à Open Food Facts", async () => {
    const { fetch, appels } = fauxFetch(() =>
      json({ hits: [NUTELLA, { ...NUTELLA, code: "1", countries_tags: ["en:italy"] }, { ...NUTELLA, code: "2", countries_tags: undefined }] }),
    );
    const produits = await clientOpenFoodFacts({ fetch }).chercher("nutella");
    expect(produits.map((p) => p.code)).toEqual(["3017624010701"]);
    expect(appels[0].url.searchParams.get("q")).toContain('countries_tags:"en:france"');
  });

  it("convertit en kcal un produit fourni seulement en kJ", async () => {
    const enKj = { ...NUTELLA, nutriments: { ...NUTELLA.nutriments, "energy-kcal_100g": undefined } };
    const { fetch } = fauxFetch(() => json({ hits: [enKj] }));
    const [p] = await clientOpenFoodFacts({ fetch }).chercher("nutella");
    expect(p.valeurs.kcal).toBeCloseTo(538.2, 1);
  });

  it("calcule les valeurs pour 100 g quand seules celles par portion sont fournies", async () => {
    const parPortion = {
      ...NUTELLA,
      nutriments: {
        "energy-kcal_serving": 81,
        proteins_serving: 0.9,
        carbohydrates_serving: 8.7,
        fat_serving: 4.65,
      },
    };
    const { fetch } = fauxFetch(() => json({ hits: [parPortion] }));
    const [p] = await clientOpenFoodFacts({ fetch }).chercher("nutella");
    expect(p.valeurs).toMatchObject({ kcal: 540, proteines: 6, glucides: 58, lipides: 31, sucres: null });
  });

  it("garde l'unité ml d'une boisson, et nomme la Portion d'après Open Food Facts", async () => {
    const boisson = { ...NUTELLA, product_quantity_unit: "ml", serving_size: "1 verre (250 ml)", serving_quantity: "250" };
    const { fetch } = fauxFetch(() => json({ hits: [boisson] }));
    const [p] = await clientOpenFoodFacts({ fetch }).chercher("jus");
    expect(p.unite).toBe("ml");
    expect(p.portions).toEqual([{ nom: "1 verre", grammes: 250 }]);
  });

  it("écarte un produit sans nom ou sans kcal et Macros", async () => {
    const { fetch } = fauxFetch(() =>
      json({
        hits: [
          { ...NUTELLA, product_name: "" },
          { ...NUTELLA, nutriments: { "energy-kcal_100g": 539 } },
          { ...NUTELLA, nutriments: { proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } },
        ],
      }),
    );
    expect(await clientOpenFoodFacts({ fetch }).chercher("nutella")).toEqual([]);
  });

  it("s'identifie avec un User-Agent générique et n'envoie que le texte cherché", async () => {
    const { fetch, appels } = fauxFetch(() => json({ hits: [] }));
    await clientOpenFoodFacts({ fetch }).chercher("Pâte à tartiner !");
    const [{ url, init }] = appels;
    expect(new Headers(init?.headers).get("user-agent")).toBe(USER_AGENT);
    expect(USER_AGENT).toMatch(/^Simcal\/[\d.]+ \(\+https:\/\/github\.com\/d-floutier\/simcal\)$/);
    expect(url.origin).toBe("https://search.openfoodfacts.org");
    expect(url.searchParams.get("q")).toBe('pate a tartiner countries_tags:"en:france"');
    expect([...url.searchParams.keys()].sort()).toEqual(["fields", "langs", "page_size", "q"]);
    expect(init?.credentials ?? "omit").toBe("omit");
  });

  it("échoue vite quand Open Food Facts ne répond pas", async () => {
    const { fetch } = fauxFetch(
      (url) =>
        new Promise<Response>(() => {
          void url;
        }),
    );
    // Le faux fetch ignore le signal : le client doit abandonner lui-même.
    const debut = Date.now();
    await expect(clientOpenFoodFacts({ fetch, delaiMs: 50 }).chercher("nutella")).rejects.toThrow();
    expect(Date.now() - debut).toBeLessThan(1000);
  });

  it("échoue sur une réponse en erreur (503)", async () => {
    const { fetch } = fauxFetch(() => new Response("<html>Page temporarily unavailable</html>", { status: 503 }));
    await expect(clientOpenFoodFacts({ fetch }).chercher("nutella")).rejects.toThrow();
  });
});

describe("client Open Food Facts : Code-barres", () => {
  it("lit un produit par son Code-barres", async () => {
    const { fetch, appels } = fauxFetch(() =>
      json({ code: NUTELLA.code, status: 1, product: { ...NUTELLA, brands: "Ferrero, Nutella" } }),
    );
    const p = await clientOpenFoodFacts({ fetch }).lireProduit("3017624010701");
    expect(p).toMatchObject({ code: "3017624010701", nom: "Nutella", marque: "Ferrero", valeurs: { kcal: 539 } });
    expect(appels[0].url.pathname).toBe("/api/v2/product/3017624010701");
    expect(new Headers(appels[0].init?.headers).get("user-agent")).toBe(USER_AGENT);
  });

  it("renvoie null pour un produit inconnu, sans appeler Open Food Facts pour un code invalide", async () => {
    const { fetch, appels } = fauxFetch(() => json({ code: "3000000000001", status: 0 }, 404));
    expect(await clientOpenFoodFacts({ fetch }).lireProduit("3000000000001")).toBeNull();
    expect(await clientOpenFoodFacts({ fetch }).lireProduit("abc; drop")).toBeNull();
    expect(appels).toHaveLength(1);
  });

  it("renvoie null pour un produit qui n'est pas vendu en France", async () => {
    const { fetch } = fauxFetch(() => json({ status: 1, product: { ...NUTELLA, countries_tags: ["en:italy"] } }));
    expect(await clientOpenFoodFacts({ fetch }).lireProduit("3017624010701")).toBeNull();
  });
});
