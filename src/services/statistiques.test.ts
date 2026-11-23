import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import {
  ajouterEntree,
  chercherAliments,
  enregistrerPesee,
  enregistrerProfil,
  statistiques,
  type Contexte,
  type SaisieProfil,
} from "@/services";
import { importerAlimentsGeneriques } from "@/sources/ciqual";

// Un homme de 30 ans en novembre 2026, 80 kg : Objectif calorique 2 209 kcal (perdre 0,5 kg/sem.).
// Chaque kg en moins retire 15,5 kcal à l'objectif (activité modérée).
const SAISIE: SaisieProfil = {
  sexe: "homme",
  dateNaissance: "1996-01-01",
  tailleCm: 180,
  poidsKg: 80,
  niveauActivite: "modere",
  fuseau: "Europe/Paris",
  objectif: { sens: "perdre", poidsCibleKg: 72, rythme: 0.5 },
  repartition: { glucides: 50, proteines: 20, lipides: 30 },
};

/** Midi à Paris, le jour donné. */
const midi = (jour: string) => new Date(`${jour}T11:00:00Z`);
const AUJOURDHUI = midi("2026-11-23");

describe("statistiques", () => {
  let ctx: Contexte;
  let idAliment: (texte: string) => Promise<string>;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-01"));
    idAliment = async (texte) => (await chercherAliments(ctx, texte))[0].id;
  });

  const ajouter = async (texte: string, grammes: number, jour: string) =>
    ajouterEntree(
      ctx,
      { jour, repas: "dejeuner", alimentId: await idAliment(texte), quantite: { unite: "g", valeur: grammes } },
      AUJOURDHUI,
    );

  it("donne pour chaque jour les kcal consommées et l'objectif de ce jour-là", async () => {
    // Une Pesée à 78 kg le 20 fait passer l'objectif de 2 209 à 2 178 kcal à partir de ce jour.
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);
    await ajouter("pomme crue", 200, "2026-11-18");
    await ajouter("riz blanc cuit", 100, "2026-11-21");
    await ajouter("pomme crue", 100, "2026-11-21");

    const stats = await statistiques(ctx, { jours: 7 }, AUJOURDHUI);

    expect(stats.du).toBe("2026-11-17");
    expect(stats.au).toBe("2026-11-23");
    expect(stats.jours.map((j) => j.jour)).toEqual([
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
      "2026-11-23",
    ]);
    expect(stats.jours.map((j) => j.objectifKcal)).toEqual([2209, 2209, 2209, 2178, 2178, 2178, 2178]);
    // Pomme 54 kcal et riz cuit 155 kcal pour 100 g ; les jours sans Entrée sont vides, pas à 0.
    expect(stats.jours.map((j) => (j.kcal === null ? null : Math.round(j.kcal * 100) / 100))).toEqual([
      null,
      108,
      null,
      null,
      209,
      null,
      null,
    ]);
  });

  it("fait la moyenne des Macros sur les seuls jours avec Entrée, comparée aux cibles de ces jours", async () => {
    await ajouter("pomme crue", 200, "2026-11-18");
    await ajouter("riz blanc cuit", 100, "2026-11-21");

    const stats = await statistiques(ctx, { jours: 7 }, AUJOURDHUI);

    // (108 + 155) / 2 jours, et non / 7
    expect(stats.joursAvecEntree).toBe(2);
    expect(stats.moyenne?.kcal).toBeCloseTo(131.5, 9);
    expect(stats.moyenne?.proteines).toBeCloseTo(1.825, 9);
    expect(stats.moyenne?.glucides).toBeCloseTo(28.2, 9);
    expect(stats.moyenne?.lipides).toBeCloseTo(0.6, 9);
    // 2 209 kcal : 50 % de glucides (4 kcal/g), 20 % de protéines (4), 30 % de lipides (9)
    expect(stats.cibles?.kcal).toBeCloseTo(2209, 9);
    expect(stats.cibles?.glucides).toBeCloseTo(276.125, 9);
    expect(stats.cibles?.proteines).toBeCloseTo(110.45, 9);
    expect(stats.cibles?.lipides).toBeCloseTo(73.6333333, 6);
  });

  it("compare la moyenne à la moyenne des cibles de chaque jour avec Entrée, pas à celles d'aujourd'hui", async () => {
    // Objectif 2 209 kcal le 18 ; une Pesée à 78 kg le 20 le fait passer à 2 178 kcal ; 76 kg le 23 : 2 147 kcal.
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 76 }, AUJOURDHUI);
    await ajouter("pomme crue", 200, "2026-11-18");
    await ajouter("riz blanc cuit", 100, "2026-11-21");

    const stats = await statistiques(ctx, { jours: 7 }, AUJOURDHUI);

    // (2 209 + 2 178) / 2, le 23 (sans Entrée) n'entre pas dans la moyenne
    expect(stats.cibles?.kcal).toBeCloseTo(2193.5, 9);
    expect(stats.cibles?.glucides).toBeCloseTo(274.1875, 9);
    expect(stats.cibles?.proteines).toBeCloseTo(109.675, 9);
    expect(stats.cibles?.lipides).toBeCloseTo(73.1166667, 6);
  });

  it("n'a pas de moyenne quand aucun jour n'a d'Entrée", async () => {
    const stats = await statistiques(ctx, { jours: 7 }, AUJOURDHUI);

    expect(stats.joursAvecEntree).toBe(0);
    expect(stats.moyenne).toBeNull();
    expect(stats.jours.every((j) => j.kcal === null)).toBe(true);
  });

  it("donne les Pesées de la période, de la plus ancienne à la plus récente, et le Poids cible", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-10", poidsKg: 79.6 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-22", poidsKg: 78.4 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-18", poidsKg: 79 }, AUJOURDHUI);

    const stats = await statistiques(ctx, { jours: 7 }, AUJOURDHUI);

    expect(stats.pesees).toEqual([
      { jour: "2026-11-18", poidsKg: 79 },
      { jour: "2026-11-22", poidsKg: 78.4 },
    ]);
    expect(stats.poidsCibleKg).toBe(72);
  });

  it("couvre 30 jours, sans objectif avant la première configuration", async () => {
    const stats = await statistiques(ctx, { jours: 30 }, AUJOURDHUI);

    expect(stats.jours).toHaveLength(30);
    expect(stats.du).toBe("2026-10-25");
    expect(stats.jours.find((j) => j.jour === "2026-10-31")?.objectifKcal).toBeNull();
    expect(stats.jours.find((j) => j.jour === "2026-11-01")?.objectifKcal).toBe(2209);
  });

  it("n'a pas de Poids cible pour un Objectif « maintenir »", async () => {
    await enregistrerProfil(ctx, { ...SAISIE, objectif: { sens: "maintenir" } }, AUJOURDHUI);

    expect((await statistiques(ctx, { jours: 7 }, AUJOURDHUI)).poidsCibleKg).toBeNull();
  });

  it("ne voit pas les données d'un autre utilisateur", async () => {
    await ajouter("pomme crue", 200, "2026-11-18");
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };
    await enregistrerProfil(autre, SAISIE, midi("2026-11-01"));

    const stats = await statistiques(autre, { jours: 7 }, AUJOURDHUI);

    expect(stats.joursAvecEntree).toBe(0);
  });
});
