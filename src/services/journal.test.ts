import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { enregistrerProfil, lireJournal } from "@/services";
import type { Db } from "@/db/client";

describe("lireJournal", () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("donne un Journal vide avec les quatre Repas pour un nouvel utilisateur", async () => {
    const userId = await creerUtilisateur(db, "moi@exemple.fr");

    const journal = await lireJournal({ db, userId }, "2026-11-23");

    expect(journal).toEqual({
      jour: "2026-11-23",
      repas: [
        { repas: "petit-dejeuner", entrees: [] },
        { repas: "dejeuner", entrees: [] },
        { repas: "diner", entrees: [] },
        { repas: "collations", entrees: [] },
      ],
      objectif: null,
    });
  });

  it("donne l'Objectif calorique et les cibles de Macros du jour", async () => {
    const userId = await creerUtilisateur(db, "moi@exemple.fr");
    await enregistrerProfil(
      { db, userId },
      {
        sexe: "femme",
        dateNaissance: "2001-06-15",
        tailleCm: 165,
        poidsKg: 60,
        niveauActivite: "sedentaire",
        fuseau: "Europe/Paris",
        objectif: { sens: "maintenir" },
        repartition: { glucides: 50, proteines: 20, lipides: 30 },
      },
      new Date("2026-11-23T11:00:00Z"),
    );

    const { objectif } = await lireJournal({ db, userId }, "2026-11-23");

    // 25 ans : Dépense de repos 1 345,25, Dépense totale 1 614,3
    expect(objectif?.kcal).toBeCloseTo(1614.3, 9);
    expect(objectif?.macros.glucides).toBeCloseTo(201.7875, 9);
    expect(objectif?.macros.proteines).toBeCloseTo(80.715, 9);
    expect(objectif?.macros.lipides).toBeCloseTo(53.81, 9);
  });
});
