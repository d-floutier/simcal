import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { chercherAliments, lireAliment, type Contexte } from "@/services";
import { importerAlimentsGeneriques, lireFichierCiqual } from "@/sources/ciqual";

describe("recherche des Aliments génériques", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  const noms = async (texte: string) => (await chercherAliments(ctx, texte)).map((a) => a.nom);

  it("« creme » trouve « Crème », sans tenir compte des accents ni de la casse", async () => {
    expect(await noms("creme")).toContain("Crème 30% MG, épaisse, rayon frais");
    expect(await noms("CRÈME épaisse")).toEqual(["Crème 30% MG, épaisse, rayon frais"]);
  });

  it("cherche chaque mot, même en début de mot, et au pluriel", async () => {
    expect(await noms("riz blanc cuit")).toEqual(["Riz blanc, cuit, sans sel ajouté"]);
    expect(await noms("pom")).toEqual(
      expect.arrayContaining(["Pomme, chair et peau, crue", "Pomme de terre, bouillie/cuite à l'eau"]),
    );
    expect(await noms("pommes crues")).toEqual(["Pomme, chair et peau, crue"]);
  });

  it("ne renvoie rien pour une recherche vide ou sans correspondance", async () => {
    expect(await chercherAliments(ctx, "  ")).toEqual([]);
    expect(await chercherAliments(ctx, "zzzz")).toEqual([]);
    expect(await chercherAliments(ctx, "'&|!:*()")).toEqual([]);
  });

  it("donne pour chaque résultat son type et ses kcal pour 100 g", async () => {
    const [pomme] = await chercherAliments(ctx, "pomme crue");
    expect(pomme).toMatchObject({ type: "generique", nom: "Pomme, chair et peau, crue", marque: null, kcal: 54, unite: "g" });
  });

  it("classe d'abord les noms qui commencent par la recherche", async () => {
    const [premier] = await noms("pomme");
    expect(premier).toBe("Pomme, chair et peau, crue");
  });
});

describe("fiche d'un Aliment", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  it("montre les valeurs pour 100 g et les nutriments facultatifs connus", async () => {
    const [{ id }] = await chercherAliments(ctx, "creme epaisse");
    expect(await lireAliment(ctx, id)).toEqual({
      id,
      type: "generique",
      nom: "Crème 30% MG, épaisse, rayon frais",
      marque: null,
      unite: "g",
      codeBarres: null,
      valeurs: { kcal: 285, proteines: 2.32, glucides: 1.38, lipides: 29.9, sucres: 1.38, fibres: 0, satures: 19.5, sel: 0.065 },
      portions: [],
    });
  });

  it("laisse inconnu un nutriment facultatif que CIQUAL ne donne pas", async () => {
    const [{ id }] = await chercherAliments(ctx, "pomme de terre primeur");
    expect((await lireAliment(ctx, id))?.valeurs.satures).toBeNull();
  });

  it("renvoie null pour un Aliment inconnu", async () => {
    expect(await lireAliment(ctx, "00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(await lireAliment(ctx, "pas-un-uuid")).toBeNull();
  });
});

describe("import CIQUAL", () => {
  it("importe le fichier du repo, et le relancer ne crée pas de doublon", async () => {
    const db = await createTestDb();
    const ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    const aliments = lireFichierCiqual(path.join(process.cwd(), "data/ciqual-2025.csv"));
    expect(aliments.length).toBeGreaterThan(3000);

    await importerAlimentsGeneriques(db, aliments);
    const premier = await chercherAliments(ctx, "pomme crue");
    await importerAlimentsGeneriques(db, aliments);
    expect(await chercherAliments(ctx, "pomme crue")).toEqual(premier);

    expect((await chercherAliments(ctx, "creme")).some((a) => a.nom.startsWith("Crème"))).toBe(true);
    expect((await chercherAliments(ctx, "riz blanc cuit")).length).toBeGreaterThan(0);
  });

  it("met à jour un Aliment générique dont les valeurs ont changé", async () => {
    const db = await createTestDb();
    const ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    const pomme = ALIMENTS_TEST.find((a) => a.code === "13039")!;
    await importerAlimentsGeneriques(db, [{ ...pomme, kcal: 56 }]);

    const [resultat] = await chercherAliments(ctx, "pomme crue");
    expect(resultat.kcal).toBe(56);
  });
}, 30_000);
