import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import {
  ajouterEntree,
  chercherAliments,
  EntreeIntrouvable,
  enregistrerProfil,
  JourFutur,
  lireJournal,
  modifierEntree,
  SaisieEntreeInvalide,
  supprimerEntree,
  type Contexte,
  type SaisieProfil,
} from "@/services";
import { aliment } from "@/db/schema";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import type { Db } from "@/db/client";

// Une femme de 25 ans le 2026-11-23, sédentaire, qui maintient : 1 614,3 kcal.
const PROFIL: SaisieProfil = {
  sexe: "femme",
  dateNaissance: "2001-06-15",
  tailleCm: 165,
  poidsKg: 60,
  niveauActivite: "sedentaire",
  fuseau: "Europe/Paris",
  objectif: { sens: "maintenir" },
  repartition: { glucides: 50, proteines: 20, lipides: 30 },
};

/** Midi à Paris, le jour donné. */
const midi = (jour: string) => new Date(`${jour}T11:00:00Z`);
const AUJOURDHUI = "2026-11-23";

describe("lireJournal", () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("donne un Journal vide avec les quatre Repas pour un nouvel utilisateur", async () => {
    const userId = await creerUtilisateur(db, "moi@exemple.fr");

    const journal = await lireJournal({ db, userId }, AUJOURDHUI);

    const zero = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
    expect(journal).toEqual({
      jour: AUJOURDHUI,
      repas: [
        { repas: "petit-dejeuner", entrees: [], total: zero },
        { repas: "dejeuner", entrees: [], total: zero },
        { repas: "diner", entrees: [], total: zero },
        { repas: "collations", entrees: [], total: zero },
      ],
      total: zero,
      objectif: null,
      reste: null,
    });
  });

  it("donne l'Objectif calorique et les cibles de Macros du jour", async () => {
    const userId = await creerUtilisateur(db, "moi@exemple.fr");
    await enregistrerProfil({ db, userId }, PROFIL, midi(AUJOURDHUI));

    const { objectif, reste } = await lireJournal({ db, userId }, AUJOURDHUI);

    // 25 ans : Dépense de repos 1 345,25, Dépense totale 1 614,3
    expect(objectif?.kcal).toBeCloseTo(1614.3, 9);
    expect(objectif?.macros.glucides).toBeCloseTo(201.7875, 9);
    expect(objectif?.macros.proteines).toBeCloseTo(80.715, 9);
    expect(objectif?.macros.lipides).toBeCloseTo(53.81, 9);
    expect(reste?.kcal).toBeCloseTo(1614.3, 9);
  });
});

describe("Entrées du Journal", () => {
  let ctx: Contexte;
  let idAliment: (texte: string) => Promise<string>;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, PROFIL, midi("2026-11-01"));
    idAliment = async (texte) => (await chercherAliments(ctx, texte))[0].id;
  });

  const ajouter = async (texte: string, grammes: number, repas: "petit-dejeuner" | "dejeuner" | "diner" | "collations", jour = AUJOURDHUI) =>
    ajouterEntree(
      ctx,
      { jour, repas, alimentId: await idAliment(texte), quantite: { unite: "g", valeur: grammes } },
      midi(AUJOURDHUI),
    );

  it("ajoute une Entrée à un Repas et calcule ses valeurs pour la quantité", async () => {
    const entree = await ajouter("pomme crue", 150, "collations");

    expect(entree).toMatchObject({
      jour: AUJOURDHUI,
      repas: "collations",
      nom: "Pomme, chair et peau, crue",
      marque: null,
      quantite: { unite: "g", valeur: 150 },
      grammes: 150,
    });
    expect(entree.valeurs.kcal).toBeCloseTo(81, 9);
    expect(entree.valeurs.glucides).toBeCloseTo(17.4, 9);
    expect(entree.valeurs.fibres).toBeCloseTo(2.1, 9);

    const journal = await lireJournal(ctx, AUJOURDHUI);
    expect(journal.repas.find((r) => r.repas === "collations")?.entrees).toEqual([entree]);
  });

  it("accepte une quantité en millilitres, à 1 ml = 1 g", async () => {
    const entree = await ajouterEntree(
      ctx,
      { jour: AUJOURDHUI, repas: "petit-dejeuner", alimentId: await idAliment("lait"), quantite: { unite: "ml", valeur: 250 } },
      midi(AUJOURDHUI),
    );

    expect(entree.quantite).toEqual({ unite: "ml", valeur: 250 });
    expect(entree.grammes).toBe(250);
    expect(entree.valeurs.kcal).toBeCloseTo(116, 9);
  });

  it("totalise chaque Repas et le jour, et donne le reste par rapport à l'objectif du jour", async () => {
    await ajouter("lait", 250, "petit-dejeuner"); // 116 kcal
    await ajouter("riz blanc cuit", 200, "dejeuner"); // 310 kcal
    await ajouter("pomme de terre bouillie", 300, "dejeuner"); // 243 kcal
    await ajouter("pomme crue", 150, "collations"); // 81 kcal

    const journal = await lireJournal(ctx, AUJOURDHUI);

    const total = (repas: string) => journal.repas.find((r) => r.repas === repas)!.total;
    expect(total("petit-dejeuner").kcal).toBeCloseTo(116, 9);
    expect(total("dejeuner").kcal).toBeCloseTo(553, 9);
    expect(total("dejeuner").proteines).toBeCloseTo(11.7, 9);
    expect(total("diner").kcal).toBe(0);
    expect(journal.total.kcal).toBeCloseTo(750, 9);
    expect(journal.reste?.kcal).toBeCloseTo(864.3, 9);
    // 7,975 + 6,3 + 5,4 + 0,375 g de protéines pour une cible de 80,715 g
    expect(journal.reste?.proteines).toBeCloseTo(60.665, 9);
  });

  it("ne montre que les Entrées du jour demandé", async () => {
    await ajouter("pomme crue", 100, "collations", "2026-11-22");

    expect((await lireJournal(ctx, AUJOURDHUI)).total.kcal).toBe(0);
    expect((await lireJournal(ctx, "2026-11-22")).total.kcal).toBeCloseTo(54, 9);
  });

  it("modifie la quantité ou le Repas d'une Entrée", async () => {
    const { id } = await ajouter("pomme crue", 150, "collations");

    const modifiee = await modifierEntree(ctx, id, { quantite: { unite: "g", valeur: 200 } });
    expect(modifiee.valeurs.kcal).toBeCloseTo(108, 9);
    await modifierEntree(ctx, id, { repas: "dejeuner" });

    const journal = await lireJournal(ctx, AUJOURDHUI);
    expect(journal.repas.find((r) => r.repas === "collations")?.entrees).toEqual([]);
    const [entree] = journal.repas.find((r) => r.repas === "dejeuner")!.entrees;
    expect(entree).toMatchObject({ id, grammes: 200, repas: "dejeuner" });
  });

  it("supprime une Entrée", async () => {
    const { id } = await ajouter("pomme crue", 150, "collations");
    await ajouter("lait", 250, "collations");

    await supprimerEntree(ctx, id);

    const journal = await lireJournal(ctx, AUJOURDHUI);
    expect(journal.repas.find((r) => r.repas === "collations")?.entrees.map((e) => e.nom)).toEqual([
      "Lait demi-écrémé, pasteurisé",
    ]);
    await expect(supprimerEntree(ctx, id)).rejects.toThrow(EntreeIntrouvable);
  });

  it("garde la copie des valeurs, du nom et de la marque quand l'Aliment est corrigé ensuite (ADR-0001)", async () => {
    const { id } = await ajouter("pomme crue", 100, "collations");
    const pomme = ALIMENTS_TEST.find((a) => a.code === "13039")!;
    await importerAlimentsGeneriques(ctx.db, [{ ...pomme, nom: "Pomme, crue", kcal: 60, glucides: 14 }]);

    const journal = await lireJournal(ctx, AUJOURDHUI);
    const [entree] = journal.repas.find((r) => r.repas === "collations")!.entrees;
    expect(entree).toMatchObject({ id, nom: "Pomme, chair et peau, crue", marque: null });
    expect(entree.pour100g).toMatchObject({ kcal: 54, glucides: 11.6 });
    expect(journal.total.kcal).toBeCloseTo(54, 9);

    // Modifier la quantité repart de la copie, pas des valeurs actuelles de l'Aliment.
    const modifiee = await modifierEntree(ctx, id, { quantite: { unite: "g", valeur: 200 } });
    expect(modifiee.valeurs.kcal).toBeCloseTo(108, 9);
  });

  it("garde l'Entrée et ses valeurs quand l'Aliment d'origine disparaît", async () => {
    const entree = await ajouter("pomme crue", 100, "collations");
    await ctx.db.delete(aliment).where(eq(aliment.id, entree.alimentId!));

    const [gardee] = (await lireJournal(ctx, AUJOURDHUI)).repas.find((r) => r.repas === "collations")!.entrees;
    expect(gardee).toMatchObject({ id: entree.id, alimentId: null, nom: "Pomme, chair et peau, crue" });
    expect(gardee.valeurs.kcal).toBeCloseTo(54, 9);
  });

  it("permet de noter et de modifier un jour passé", async () => {
    const { id } = await ajouter("pomme crue", 100, "diner", "2026-11-02");
    await modifierEntree(ctx, id, { quantite: { unite: "g", valeur: 50 } });

    expect((await lireJournal(ctx, "2026-11-02")).total.kcal).toBeCloseTo(27, 9);
  });

  it("refuse une Entrée sur un jour futur dans le fuseau de l'utilisateur", async () => {
    const alimentId = await idAliment("pomme crue");
    const saisie = (jour: string) => ({ jour, repas: "diner" as const, alimentId, quantite: { unite: "g" as const, valeur: 100 } });

    // 23 h 30 UTC le 23 : il est déjà 0 h 30 le 24 à Paris.
    const tardif = new Date("2026-11-23T23:30:00Z");
    await expect(ajouterEntree(ctx, saisie("2026-11-24"), tardif)).resolves.toMatchObject({ jour: "2026-11-24" });
    await expect(ajouterEntree(ctx, saisie("2026-11-25"), tardif)).rejects.toThrow(JourFutur);
    // 22 h 30 UTC le 23 : 23 h 30 à Paris, le 24 est encore futur.
    await expect(ajouterEntree(ctx, saisie("2026-11-24"), new Date("2026-11-23T22:30:00Z"))).rejects.toThrow(
      JourFutur,
    );
    expect((await lireJournal(ctx, "2026-11-25")).total.kcal).toBe(0);
  });

  it.each([
    ["quantite", { quantite: { unite: "g" as const, valeur: 0 } }],
    ["quantite", { quantite: { unite: "g" as const, valeur: Number.NaN } }],
    ["quantite", { quantite: { unite: "kg" as "g", valeur: 1 } }],
    ["repas", { repas: "gouter" as "diner" }],
    ["jour", { jour: "2026-02-30" }],
  ])("refuse un champ %s invalide", async (champ, modif) => {
    const saisie = {
      jour: AUJOURDHUI,
      repas: "diner" as const,
      alimentId: await idAliment("pomme crue"),
      quantite: { unite: "g" as const, valeur: 100 },
      ...modif,
    };
    const erreur = await ajouterEntree(ctx, saisie, midi(AUJOURDHUI)).catch((e) => e);
    expect(erreur).toBeInstanceOf(SaisieEntreeInvalide);
    expect(erreur.champs).toEqual([champ]);
  });

  it("refuse un Aliment inconnu", async () => {
    const saisie = {
      jour: AUJOURDHUI,
      repas: "diner" as const,
      alimentId: "00000000-0000-0000-0000-000000000000",
      quantite: { unite: "g" as const, valeur: 100 },
    };
    const erreur = await ajouterEntree(ctx, saisie, midi(AUJOURDHUI)).catch((e) => e);
    expect(erreur).toBeInstanceOf(SaisieEntreeInvalide);
    expect(erreur.champs).toEqual(["aliment"]);
  });

  it("isole les Entrées d'un utilisateur de celles d'un autre", async () => {
    const { id } = await ajouter("pomme crue", 100, "collations");
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };

    expect((await lireJournal(autre, AUJOURDHUI)).total.kcal).toBe(0);
    await expect(modifierEntree(autre, id, { repas: "diner" })).rejects.toThrow(EntreeIntrouvable);
    await expect(supprimerEntree(autre, id)).rejects.toThrow(EntreeIntrouvable);
    expect((await lireJournal(ctx, AUJOURDHUI)).total.kcal).toBeCloseTo(54, 9);
  });
});
