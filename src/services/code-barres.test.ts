import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import { fauxOpenFoodFacts, type FauxOpenFoodFacts } from "@/sources/open-food-facts-faux";
import {
  creerAlimentPersonnalise,
  lireAliment,
  sourcesParDefaut,
  trouverParCodeBarres,
  type Contexte,
} from "@/services";

const NUTELLA = "3017624010701";
const INCONNU = "3560070000001";

describe("Trouver un Aliment par Code-barres", () => {
  let ctx: Contexte;
  let off: FauxOpenFoodFacts;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    off = fauxOpenFoodFacts();
  });

  const trouver = (code: string) => trouverParCodeBarres(ctx, code, sourcesParDefaut(ctx, { openFoodFacts: off }));

  it("trouve un Produit chez Open Food Facts et le garde en base, avec ses Portions", async () => {
    const resultat = await trouver(NUTELLA);
    expect(resultat).toMatchObject({ trouve: true, aliment: { type: "produit", nom: "Nutella", marque: "Ferrero" } });
    if (!resultat.trouve) throw new Error("attendu : trouvé");
    const fiche = await lireAliment(ctx, resultat.aliment.id);
    expect(fiche).toMatchObject({ codeBarres: NUTELLA, portions: [{ nom: "1 portion", grammes: 15 }] });
  });

  it("retrouve ensuite le Produit gardé sans rappeler Open Food Facts, même en panne", async () => {
    const premier = await trouver(NUTELLA);
    off = fauxOpenFoodFacts({ enPanne: true });
    const second = await trouver(NUTELLA);
    expect(second).toEqual(premier);
    expect(off.appels.lectures).toBe(0);
  });

  it("trouve en priorité l'Aliment personnalisé lié au code, sans appeler Open Food Facts", async () => {
    await creerAlimentPersonnalise(ctx, {
      nom: "Ma pâte à tartiner",
      unite: "g",
      codeBarres: NUTELLA,
      valeurs: { kcal: 500, proteines: 6, glucides: 55, lipides: 28 },
    });
    expect(await trouver(NUTELLA)).toMatchObject({
      trouve: true,
      aliment: { type: "personnalise", nom: "Ma pâte à tartiner" },
    });
    expect(off.appels.lectures).toBe(0);
  });

  it("préfère l'Aliment personnalisé à un Produit déjà gardé en base", async () => {
    await trouver(NUTELLA);
    await creerAlimentPersonnalise(ctx, {
      nom: "Ma pâte à tartiner",
      unite: "g",
      codeBarres: NUTELLA,
      valeurs: { kcal: 500, proteines: 6, glucides: 55, lipides: 28 },
    });
    expect(await trouver(NUTELLA)).toMatchObject({ trouve: true, aliment: { type: "personnalise" } });
  });

  it("ne trouve pas l'Aliment personnalisé lié au code par un autre utilisateur", async () => {
    await creerAlimentPersonnalise(ctx, {
      nom: "Ma pâte à tartiner",
      unite: "g",
      codeBarres: NUTELLA,
      valeurs: { kcal: 500, proteines: 6, glucides: 55, lipides: 28 },
    });
    ctx = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };
    expect(await trouver(NUTELLA)).toMatchObject({ trouve: true, aliment: { type: "produit", nom: "Nutella" } });
  });

  it("signale un code introuvable, puis retrouve l'Aliment personnalisé créé pour ce code", async () => {
    expect(await trouver(INCONNU)).toEqual({ trouve: false, code: INCONNU });

    await creerAlimentPersonnalise(ctx, {
      nom: "Biscuits de la boulangerie",
      unite: "g",
      codeBarres: INCONNU,
      valeurs: { kcal: 450, proteines: 7, glucides: 65, lipides: 18 },
    });
    expect(await trouver(INCONNU)).toMatchObject({
      trouve: true,
      aliment: { type: "personnalise", nom: "Biscuits de la boulangerie" },
    });
  });

  it("accepte un code tapé avec des espaces", async () => {
    expect(await trouver(" 3017624 010701 ")).toMatchObject({ trouve: true, aliment: { nom: "Nutella" } });
  });

  it("refuse un code qui n'est pas un Code-barres, sans appeler Open Food Facts", async () => {
    expect(await trouver("12ab")).toEqual({ trouve: false, code: "12ab", invalide: true });
    expect(await trouver("1234567")).toMatchObject({ trouve: false, invalide: true });
    expect(off.appels.lectures).toBe(0);
  });

  it("signale un code introuvable quand Open Food Facts est en panne", async () => {
    off = fauxOpenFoodFacts({ enPanne: true });
    expect(await trouver(NUTELLA)).toEqual({ trouve: false, code: NUTELLA, horsService: true });
  });
});
