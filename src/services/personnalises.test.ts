import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import { sourcePersonnalises } from "@/sources/personnalises";
import { ALIMENTS_TEST } from "@/test/aliments";
import {
  ajouterEntree,
  ajouterPortion,
  chercherAliments,
  modifierPortion,
  PortionIntrouvable,
  SaisiePortionInvalide,
  supprimerPortion,
  modifierEntree,
  lireRecents,
  SaisieEntreeInvalide,
  AlimentIntrouvable,
  creerAlimentPersonnalise,
  lireAliment,
  lireJournal,
  modifierAlimentPersonnalise,
  supprimerAlimentPersonnalise,
  listerAlimentsPersonnalises,
  SaisieAlimentInvalide,
  type Contexte,
  type SaisieAlimentPersonnalise,
} from "@/services";

const SOUPE: SaisieAlimentPersonnalise = {
  nom: "Soupe de légumes maison",
  unite: "g",
  valeurs: { kcal: 40, proteines: 1.5, glucides: 6, lipides: 1 },
};

describe("Aliments personnalisés", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  it("crée un Aliment personnalisé avec les kcal et les Macros, et le liste", async () => {
    const cree = await creerAlimentPersonnalise(ctx, SOUPE);

    expect(cree).toEqual({
      id: expect.any(String),
      type: "personnalise",
      nom: "Soupe de légumes maison",
      marque: null,
      unite: "g",
      codeBarres: null,
      valeurs: { kcal: 40, proteines: 1.5, glucides: 6, lipides: 1, fibres: null, sucres: null, satures: null, sel: null },
      portions: [],
    });
    expect(await listerAlimentsPersonnalises(ctx)).toEqual([cree]);
  });

  it("garde les nutriments facultatifs donnés", async () => {
    const cree = await creerAlimentPersonnalise(ctx, {
      ...SOUPE,
      unite: "ml",
      valeurs: { ...SOUPE.valeurs, fibres: 1.2, sel: 0.8 },
    });
    expect(cree.unite).toBe("ml");
    expect(cree.valeurs).toEqual({ kcal: 40, proteines: 1.5, glucides: 6, lipides: 1, fibres: 1.2, sucres: null, satures: null, sel: 0.8 });
  });

  it("refuse un Aliment sans nom, sans kcal ou sans l'une des Macros, et des valeurs impossibles", async () => {
    const refus = (saisie: SaisieAlimentPersonnalise) =>
      creerAlimentPersonnalise(ctx, saisie).then(
        () => null,
        (e: unknown) => (e instanceof SaisieAlimentInvalide ? e.champs : e),
      );

    expect(await refus({ ...SOUPE, nom: "  " })).toEqual(["nom"]);
    expect(await refus({ ...SOUPE, unite: "kg" as "g" })).toEqual(["unite"]);
    expect(
      await refus({ ...SOUPE, valeurs: { kcal: Number.NaN, proteines: -1, glucides: 6, lipides: undefined as unknown as number } }),
    ).toEqual(["kcal", "proteines", "lipides"]);
    expect(await refus({ ...SOUPE, valeurs: { ...SOUPE.valeurs, glucides: 101, sel: -0.1 } })).toEqual(["glucides", "sel"]);
    expect(await listerAlimentsPersonnalises(ctx)).toEqual([]);
  });

  it("associe un Code-barres à un Aliment personnalisé, retrouvé pour son seul propriétaire", async () => {
    const cree = await creerAlimentPersonnalise(ctx, { ...SOUPE, codeBarres: " 3017620422003 " });
    const autre = await creerUtilisateur(ctx.db, "autre@exemple.fr");

    expect(cree.codeBarres).toBe("3017620422003");
    expect(await sourcePersonnalises(ctx.db, ctx.userId).trouverParCodeBarres("3017620422003")).toMatchObject({
      id: cree.id,
      type: "personnalise",
    });
    expect(await sourcePersonnalises(ctx.db, autre).trouverParCodeBarres("3017620422003")).toBeNull();
    await expect(creerAlimentPersonnalise(ctx, { ...SOUPE, codeBarres: "12ab" })).rejects.toEqual(
      new SaisieAlimentInvalide(["codeBarres"]),
    );
    expect((await modifierAlimentPersonnalise(ctx, cree.id, { ...SOUPE, codeBarres: null })).codeBarres).toBeNull();
  }, 15_000);

  it("modifie un Aliment personnalisé", async () => {
    const { id } = await creerAlimentPersonnalise(ctx, SOUPE);

    const modifie = await modifierAlimentPersonnalise(ctx, id, {
      nom: "Soupe de potiron",
      unite: "g",
      valeurs: { kcal: 35, proteines: 1, glucides: 5, lipides: 1.2, sucres: 2 },
    });

    expect(modifie).toMatchObject({ id, nom: "Soupe de potiron", valeurs: { kcal: 35, sucres: 2, fibres: null } });
    expect(await lireAliment(ctx, id)).toEqual(modifie);
  });

  it("supprime un Aliment personnalisé", async () => {
    const { id } = await creerAlimentPersonnalise(ctx, SOUPE);

    await supprimerAlimentPersonnalise(ctx, id);

    expect(await listerAlimentsPersonnalises(ctx)).toEqual([]);
    expect(await lireAliment(ctx, id)).toBeNull();
    await expect(supprimerAlimentPersonnalise(ctx, id)).rejects.toThrow(AlimentIntrouvable);
    await expect(modifierAlimentPersonnalise(ctx, id, SOUPE)).rejects.toThrow(AlimentIntrouvable);
  });
});

describe("Portions d'un Aliment personnalisé", () => {
  let ctx: Contexte;
  let soupe: string;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    soupe = (await creerAlimentPersonnalise(ctx, SOUPE)).id;
  });

  it("définit des Portions, visibles sur la fiche de la plus petite à la plus grande", async () => {
    const bol = await ajouterPortion(ctx, soupe, { nom: " 1 bol ", grammes: 300 });
    const louche = await ajouterPortion(ctx, soupe, { nom: "1 louche", grammes: 120 });

    expect(bol).toEqual({ id: expect.any(String), nom: "1 bol", grammes: 300 });
    expect((await lireAliment(ctx, soupe))?.portions).toEqual([louche, bol]);
    expect((await listerAlimentsPersonnalises(ctx))[0].portions).toEqual([louche, bol]);
  });

  it("modifie et supprime une Portion", async () => {
    const bol = await ajouterPortion(ctx, soupe, { nom: "1 bol", grammes: 300 });

    expect(await modifierPortion(ctx, bol.id, { nom: "1 grand bol", grammes: 400 })).toEqual({
      id: bol.id,
      nom: "1 grand bol",
      grammes: 400,
    });
    await supprimerPortion(ctx, bol.id);

    expect((await lireAliment(ctx, soupe))?.portions).toEqual([]);
    await expect(supprimerPortion(ctx, bol.id)).rejects.toThrow(PortionIntrouvable);
  });

  it("refuse une Portion sans nom ou sans poids positif", async () => {
    const refus = (saisie: { nom: string; grammes: number }) =>
      ajouterPortion(ctx, soupe, saisie).then(
        () => null,
        (e: unknown) => (e instanceof SaisiePortionInvalide ? e.champs : e),
      );
    expect(await refus({ nom: "", grammes: 0 })).toEqual(["nom", "grammes"]);
    expect(await refus({ nom: "1 bol", grammes: Number.NaN })).toEqual(["grammes"]);
  });

  it("ne touche qu'aux Portions de ses propres Aliments personnalisés", async () => {
    const autre: Contexte = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };
    const bol = await ajouterPortion(ctx, soupe, { nom: "1 bol", grammes: 300 });
    await importerAlimentsGeneriques(ctx.db, ALIMENTS_TEST);
    const [riz] = await chercherAliments(ctx, "riz blanc cuit");

    await expect(ajouterPortion(autre, soupe, { nom: "1 bol", grammes: 300 })).rejects.toThrow(AlimentIntrouvable);
    await expect(ajouterPortion(ctx, riz.id, { nom: "1 bol", grammes: 300 })).rejects.toThrow(AlimentIntrouvable);
    await expect(modifierPortion(autre, bol.id, { nom: "x", grammes: 1 })).rejects.toThrow(PortionIntrouvable);
    await expect(supprimerPortion(autre, bol.id)).rejects.toThrow(PortionIntrouvable);
    expect((await lireAliment(ctx, soupe))?.portions).toEqual([bol]);
  }, 15_000);
});

describe("Entrées d'un Aliment personnalisé (ADR-0001)", () => {
  const AUJOURDHUI = "2026-11-23";
  const instant = new Date(`${AUJOURDHUI}T11:00:00Z`);
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  const noter = async (alimentId: string) =>
    ajouterEntree(ctx, { jour: AUJOURDHUI, repas: "diner", alimentId, quantite: { unite: "g", valeur: 300 } }, instant);
  const entreesDuDiner = async () =>
    (await lireJournal(ctx, AUJOURDHUI)).repas.find((r) => r.repas === "diner")!.entrees;

  it("garde les valeurs des Entrées quand l'Aliment est modifié", async () => {
    const { id } = await creerAlimentPersonnalise(ctx, SOUPE);
    const entree = await noter(id);

    await modifierAlimentPersonnalise(ctx, id, { ...SOUPE, nom: "Soupe allégée", valeurs: { ...SOUPE.valeurs, kcal: 20 } });

    expect(await entreesDuDiner()).toEqual([entree]);
    expect(entree.nom).toBe("Soupe de légumes maison");
    expect(entree.valeurs.kcal).toBeCloseTo(120, 9);
  });

  it("garde et affiche les Entrées d'un Aliment supprimé, sans lien vers lui", async () => {
    const { id } = await creerAlimentPersonnalise(ctx, SOUPE);
    const entree = await noter(id);

    await supprimerAlimentPersonnalise(ctx, id);

    const [restante] = await entreesDuDiner();
    expect(restante).toEqual({ ...entree, alimentId: null });
    expect((await lireJournal(ctx, AUJOURDHUI)).total.kcal).toBeCloseTo(120, 9);
  });
});

describe("Entrées en Portions", () => {
  const AUJOURDHUI = "2026-11-23";
  const instant = new Date(`${AUJOURDHUI}T11:00:00Z`);
  let ctx: Contexte;
  let soupe: string;
  let bol: { id: string; nom: string; grammes: number };
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    soupe = (await creerAlimentPersonnalise(ctx, SOUPE)).id;
    bol = await ajouterPortion(ctx, soupe, { nom: "1 bol", grammes: 300 });
  });

  const noterEnBols = (nombre: number, portionId = bol.id) =>
    ajouterEntree(
      ctx,
      { jour: AUJOURDHUI, repas: "diner", alimentId: soupe, quantite: { unite: "portion", portionId, nombre } },
      instant,
    );

  it("note une Entrée en nombre de Portions, convertie en grammes", async () => {
    const entree = await noterEnBols(1.5);

    expect(entree.quantite).toEqual({ unite: "portion", portionId: bol.id, nombre: 1.5, nom: "1 bol", grammesParPortion: 300 });
    expect(entree.grammes).toBe(450);
    expect(entree.valeurs.kcal).toBeCloseTo(180, 9);
    expect((await lireJournal(ctx, AUJOURDHUI)).total.kcal).toBeCloseTo(180, 9);
  });

  it("garde la Portion comme dernière quantité du Récent", async () => {
    await noterEnBols(2);

    const [recent] = await lireRecents(ctx);
    expect(recent.quantite).toEqual({ unite: "portion", portionId: bol.id, nombre: 2, nom: "1 bol", grammesParPortion: 300 });
  });

  it("refuse une Portion d'un autre Aliment, inconnue ou un nombre non positif", async () => {
    const autreSoupe = (await creerAlimentPersonnalise(ctx, { ...SOUPE, nom: "Autre soupe" })).id;
    const tasse = await ajouterPortion(ctx, autreSoupe, { nom: "1 tasse", grammes: 200 });

    for (const essai of [noterEnBols(1, tasse.id), noterEnBols(1, "00000000-0000-0000-0000-000000000000"), noterEnBols(0)]) {
      await expect(essai).rejects.toEqual(new SaisieEntreeInvalide(["quantite"]));
    }
  });

  it("modifie une Entrée en grammes vers des Portions, et inversement", async () => {
    const entree = await ajouterEntree(
      ctx,
      { jour: AUJOURDHUI, repas: "diner", alimentId: soupe, quantite: { unite: "g", valeur: 100 } },
      instant,
    );

    const enBols = await modifierEntree(ctx, entree.id, { quantite: { unite: "portion", portionId: bol.id, nombre: 2 } });
    expect(enBols).toMatchObject({ grammes: 600, quantite: { unite: "portion", nombre: 2, nom: "1 bol" } });

    const enGrammes = await modifierEntree(ctx, entree.id, { quantite: { unite: "g", valeur: 250 } });
    expect(enGrammes).toMatchObject({ grammes: 250, quantite: { unite: "g", valeur: 250 } });
  });

  it("garde la Portion notée quand la Portion ou l'Aliment change ensuite", async () => {
    const entree = await noterEnBols(1);

    await modifierPortion(ctx, bol.id, { nom: "1 petit bol", grammes: 200 });
    const [apresModification] = (await lireJournal(ctx, AUJOURDHUI)).repas.find((r) => r.repas === "diner")!.entrees;
    expect(apresModification).toEqual(entree);

    await supprimerAlimentPersonnalise(ctx, soupe);
    const [apresSuppression] = (await lireJournal(ctx, AUJOURDHUI)).repas.find((r) => r.repas === "diner")!.entrees;
    expect(apresSuppression).toEqual({
      ...entree,
      alimentId: null,
      quantite: { unite: "portion", portionId: null, nombre: 1, nom: "1 bol", grammesParPortion: 300 },
    });
  });
});

describe("isolation des Aliments personnalisés", () => {
  it("rend les Aliments personnalisés d'un utilisateur invisibles pour les autres", async () => {
    const db = await createTestDb();
    const moi: Contexte = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    const autre: Contexte = { db, userId: await creerUtilisateur(db, "autre@exemple.fr") };
    const { id } = await creerAlimentPersonnalise(moi, SOUPE);

    expect(await listerAlimentsPersonnalises(autre)).toEqual([]);
    expect(await lireAliment(autre, id)).toBeNull();
    await expect(modifierAlimentPersonnalise(autre, id, SOUPE)).rejects.toThrow(AlimentIntrouvable);
    await expect(supprimerAlimentPersonnalise(autre, id)).rejects.toThrow(AlimentIntrouvable);
    await expect(
      ajouterEntree(autre, { jour: "2026-11-23", repas: "diner", alimentId: id, quantite: { unite: "g", valeur: 100 } }),
    ).rejects.toThrow();
    expect(await lireAliment(moi, id)).not.toBeNull();
  }, 15_000);

  it("cherche les Aliments personnalisés de l'utilisateur avant les Aliments génériques, sans ceux des autres", async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    const moi: Contexte = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    const autre: Contexte = { db, userId: await creerUtilisateur(db, "autre@exemple.fr") };
    await creerAlimentPersonnalise(moi, { ...SOUPE, nom: "Riz au lait de mamie" });
    await creerAlimentPersonnalise(autre, { ...SOUPE, nom: "Riz cantonais de l'autre" });

    const resultats = await chercherAliments(moi, "riz");

    expect(resultats.map((a) => [a.type, a.nom])).toEqual([
      ["personnalise", "Riz au lait de mamie"],
      ["generique", "Riz blanc, cru"],
      ["generique", "Riz blanc, cuit, sans sel ajouté"],
    ]);
    expect(resultats[0]).toMatchObject({ marque: null, kcal: 40, unite: "g" });
    expect((await chercherAliments(autre, "mamie")).map((a) => a.nom)).toEqual([]);
  }, 15_000);
});
