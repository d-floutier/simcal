import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { lireJournal } from "@/services";
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
    });
  });
});
