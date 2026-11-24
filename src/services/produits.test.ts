import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import { fauxOpenFoodFacts, type FauxOpenFoodFacts } from "@/sources/open-food-facts-faux";
import {
  ajouterEntree,
  chercherAliments,
  creerAlimentPersonnalise,
  garderProduit,
  lireAliment,
  sourcesParDefaut,
  type Contexte,
} from "@/services";

describe("Produits Open Food Facts dans la recherche", () => {
  let ctx: Contexte;
  let off: FauxOpenFoodFacts;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    off = fauxOpenFoodFacts();
  });

  const chercher = (texte: string) => chercherAliments(ctx, texte, sourcesParDefaut(ctx, { openFoodFacts: off }));

  it("trouve un Produit avec sa marque et ses kcal pour 100 g", async () => {
    const [nutella] = await chercher("nutella");
    expect(nutella).toMatchObject({ type: "produit", nom: "Nutella", marque: "Ferrero", kcal: 539, unite: "g" });
  });

  it("présente les Aliments personnalisés, puis génériques, puis les Produits", async () => {
    await creerAlimentPersonnalise(ctx, {
      nom: "Lait de la ferme",
      unite: "ml",
      valeurs: { kcal: 65, proteines: 3.3, glucides: 4.8, lipides: 3.6 },
    });
    const resultats = await chercher("lait");
    expect(resultats.map((a) => [a.type, a.nom])).toEqual([
      ["personnalise", "Lait de la ferme"],
      ["generique", "Lait demi-écrémé, pasteurisé"],
      ["produit", "Lait demi-écrémé bio"],
    ]);
  });

  it("renvoie les autres résultats quand Open Food Facts est en panne", async () => {
    off = fauxOpenFoodFacts({ enPanne: true });
    expect((await chercher("lait")).map((a) => a.nom)).toEqual(["Lait demi-écrémé, pasteurisé"]);
  });

  it("garde en base un Produit noté, avec ses Portions, et le réutilise ensuite", async () => {
    const [trouve] = await chercher("nutella");
    const produit = await garderProduit(ctx, trouve.id, off);
    expect(produit).toMatchObject({ type: "produit", nom: "Nutella", marque: "Ferrero" });

    const fiche = await lireAliment(ctx, produit!.id);
    expect(fiche).toMatchObject({
      codeBarres: "3017624010701",
      valeurs: { kcal: 539, proteines: 6.3, glucides: 57.5, lipides: 30.9, sucres: 56.3 },
      portions: [{ id: expect.any(String), nom: "1 portion", grammes: 15 }],
    });
    await ajouterEntree(
      ctx,
      { jour: "2026-01-05", repas: "petit-dejeuner", alimentId: produit!.id, quantite: { unite: "portion", portionId: fiche!.portions[0].id, nombre: 2 } },
      new Date("2026-01-05T08:00:00Z"),
    );

    // Une seule fois dans les résultats (Récent en tête), avec l'identifiant gardé en base.
    const resultats = await chercher("nutella");
    expect(resultats.map((a) => a.id)).toEqual([produit!.id]);
    // Garder de nouveau le même Produit ne le duplique pas.
    expect((await garderProduit(ctx, trouve.id, off))!.id).toBe(produit!.id);

    // Même Open Food Facts en panne, le Produit gardé est retrouvé.
    off = fauxOpenFoodFacts({ enPanne: true });
    expect((await chercher("nutella")).map((a) => a.id)).toEqual([produit!.id]);
  });

  it("un Produit gardé en base n'apparaît qu'une fois, même sans être un Récent", async () => {
    const [trouve] = await chercher("nutella");
    const produit = await garderProduit(ctx, trouve.id, off);
    expect((await chercher("nutella")).map((a) => a.id)).toEqual([produit!.id]);
  });

  it("garde en base un Produit trouvé par Code-barres", async () => {
    const [, , , ofSource] = sourcesParDefaut(ctx, { openFoodFacts: off });
    const produit = await ofSource.trouverParCodeBarres("3017624010701");
    expect(produit).toMatchObject({ type: "produit", nom: "Nutella" });
    expect(await lireAliment(ctx, produit!.id)).toMatchObject({ codeBarres: "3017624010701" });
    expect(await ofSource.trouverParCodeBarres("3000000000001")).toBeNull();
  });

  it("ne garde pas un identifiant inconnu", async () => {
    expect(await garderProduit(ctx, "off-3000000000001", off)).toBeNull();
    expect(await garderProduit(ctx, "pas-un-produit", off)).toBeNull();
  });

  it("met en cache les recherches pour ménager Open Food Facts", async () => {
    await chercher("nutella");
    await chercher("  NUTELLA ");
    expect(off.appels.recherches).toBe(1);
    // Garder un Produit vu dans une recherche ne relit pas Open Food Facts.
    const [trouve] = await chercher("nutella");
    await garderProduit(ctx, trouve.id, off);
    expect(off.appels.lectures).toBe(0);
  });

  it("ne met pas en cache une recherche en échec", async () => {
    const enPanne = fauxOpenFoodFacts({ enPanne: true });
    await chercherAliments(ctx, "nutella", sourcesParDefaut(ctx, { openFoodFacts: enPanne }));
    expect((await chercher("nutella")).map((a) => a.nom)).toEqual(["Nutella"]);
  });
});
