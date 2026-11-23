import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import {
  enregistrerPesee,
  enregistrerProfil,
  listerPesees,
  lireProfil,
  objectifDuJour,
  passerEnMaintien,
  DernierePesee,
  PeseeInvalide,
  propositionMaintien,
  refuserMaintien,
  supprimerPesee,
  type Contexte,
  type SaisieProfil,
} from "@/services";

// Un homme de 30 ans en novembre 2026, 80 kg : Objectif calorique 2 209 kcal (perdre 0,5 kg/sem.).
// Chaque kg en moins retire 10 kcal à la Dépense de repos, soit 15,5 kcal à l'objectif (modéré).
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
/** La Pesée notée par la première configuration. */
const INITIALE = { jour: "2026-11-01", poidsKg: 80 };
const kcal = async (ctx: Contexte, jour: string) => (await objectifDuJour(ctx, jour))?.kcal;

describe("Pesées", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-01"));
  });

  it("une Pesée notée est listée, la plus récente en premier", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 79.4 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 79 }, AUJOURDHUI);

    expect(await listerPesees(ctx)).toEqual([
      { jour: "2026-11-23", poidsKg: 79 },
      { jour: "2026-11-20", poidsKg: 79.4 },
      INITIALE,
    ]);
  });

  it("une nouvelle Pesée sur un jour déjà pesé remplace la précédente", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 79 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 78.6 }, AUJOURDHUI);

    expect(await listerPesees(ctx)).toEqual([{ jour: "2026-11-23", poidsKg: 78.6 }, INITIALE]);
    expect((await lireProfil(ctx))?.poidsKg).toBe(78.6);
  });

  it("refuse une Pesée sur un jour futur, dans le fuseau de l'utilisateur", async () => {
    // 23 h 30 à Paris le 23 : le 24 est encore demain.
    const soir = new Date("2026-11-23T22:30:00Z");
    await expect(enregistrerPesee(ctx, { jour: "2026-11-24", poidsKg: 79 }, soir)).rejects.toEqual(
      new PeseeInvalide(["jour"]),
    );
    // 0 h 30 à Paris le 24 : c'est aujourd'hui.
    const minuit = new Date("2026-11-23T23:30:00Z");
    await enregistrerPesee(ctx, { jour: "2026-11-24", poidsKg: 79 }, minuit);
    expect(await listerPesees(ctx)).toHaveLength(2);
  });

  it("refuse un poids ou un jour illisible", async () => {
    await expect(enregistrerPesee(ctx, { jour: "2026-02-30", poidsKg: Number.NaN }, AUJOURDHUI)).rejects.toEqual(
      new PeseeInvalide(["jour", "poidsKg"]),
    );
    await expect(enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 5 }, AUJOURDHUI)).rejects.toEqual(
      new PeseeInvalide(["poidsKg"]),
    );
    expect(await listerPesees(ctx)).toEqual([INITIALE]);
  });

  it("la Pesée la plus récente devient le poids du Profil et fixe l'objectif à partir de son jour", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    expect((await lireProfil(ctx))?.poidsKg).toBe(78);
    // Les jours passés gardent leur objectif.
    expect(await kcal(ctx, "2026-11-19")).toBeCloseTo(2209, 9);
    expect(await kcal(ctx, "2026-11-20")).toBeCloseTo(2178, 9);
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2178, 9);
  });

  it("une Pesée plus ancienne que la plus récente ne change ni le Profil ni l'objectif", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-10", poidsKg: 82 }, AUJOURDHUI);

    expect((await lireProfil(ctx))?.poidsKg).toBe(78);
    expect(await kcal(ctx, "2026-11-10")).toBeCloseTo(2209, 9);
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2178, 9);
  });

  it("une Pesée passée recalcule aussi les objectifs enregistrés après son jour", async () => {
    // Le Rythme passe à 0,25 kg le 22 : objectif 2 484 kcal à 80 kg.
    await enregistrerProfil(ctx, { ...SAISIE, objectif: { ...SAISIE.objectif, rythme: 0.25 } as SaisieProfil["objectif"] }, midi("2026-11-22"));
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    expect(await kcal(ctx, "2026-11-19")).toBeCloseTo(2209, 9);
    expect(await kcal(ctx, "2026-11-21")).toBeCloseTo(2178, 9);
    // Le changement de Rythme du 22 est conservé, avec le nouveau poids.
    expect(await kcal(ctx, "2026-11-22")).toBeCloseTo(2453, 9);
    expect(await lireProfil(ctx)).toMatchObject({ poidsKg: 78, objectif: { rythme: 0.25 } });
  });

  it("supprimer la Pesée la plus récente rend son rôle à la précédente", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-15", poidsKg: 79 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    await supprimerPesee(ctx, "2026-11-20");

    expect(await listerPesees(ctx)).toEqual([{ jour: "2026-11-15", poidsKg: 79 }, INITIALE]);
    expect((await lireProfil(ctx))?.poidsKg).toBe(79);
    expect(await kcal(ctx, "2026-11-14")).toBeCloseTo(2209, 9);
    expect(await kcal(ctx, "2026-11-15")).toBeCloseTo(2193.5, 9);
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2193.5, 9);
  });

  it("supprimer une Pesée plus ancienne ne change ni le Profil ni l'objectif", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-15", poidsKg: 79 }, AUJOURDHUI);
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    await supprimerPesee(ctx, "2026-11-15");

    expect((await lireProfil(ctx))?.poidsKg).toBe(78);
    expect(await kcal(ctx, "2026-11-15")).toBeCloseTo(2193.5, 9);
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2178, 9);
  });

  it("supprimer la seule Pesée après la première configuration rend au Profil le poids configuré", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    await supprimerPesee(ctx, "2026-11-20");

    expect((await lireProfil(ctx))?.poidsKg).toBe(80);
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2209, 9);
  });

  it("refuse de supprimer la dernière Pesée restante : le Profil a besoin d'un poids", async () => {
    await expect(supprimerPesee(ctx, "2026-11-01")).rejects.toEqual(new DernierePesee());

    expect(await listerPesees(ctx)).toEqual([INITIALE]);
    expect((await lireProfil(ctx))?.poidsKg).toBe(80);
  });

  it("supprimer la plus ancienne Pesée, quand il en reste d'autres, ne change pas le Profil", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);

    await supprimerPesee(ctx, "2026-11-01");

    expect(await listerPesees(ctx)).toEqual([{ jour: "2026-11-20", poidsKg: 78 }]);
    expect((await lireProfil(ctx))?.poidsKg).toBe(78);
  });

  it("les Pesées d'un autre utilisateur restent invisibles", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 78 }, AUJOURDHUI);
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };
    await enregistrerProfil(autre, SAISIE, AUJOURDHUI);

    expect(await listerPesees(autre)).toEqual([{ jour: "2026-11-23", poidsKg: 80 }]);
    await supprimerPesee(autre, "2026-11-20");
    expect(await listerPesees(ctx)).toHaveLength(2);
  });
});

describe("Proposition de passer en « maintenir »", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-01"));
  });

  it("n'apparaît qu'une fois le Poids cible atteint", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-20", poidsKg: 72.5 }, AUJOURDHUI);
    expect(await propositionMaintien(ctx)).toBe(false);
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 71.8 }, AUJOURDHUI);
    expect(await propositionMaintien(ctx)).toBe(true);
  });

  it("l'accepter passe l'Objectif en « maintenir » à partir d'aujourd'hui", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 72 }, AUJOURDHUI);
    await passerEnMaintien(ctx, AUJOURDHUI);

    expect(await lireProfil(ctx)).toMatchObject({ poidsKg: 72, objectif: { sens: "maintenir" } });
    // 72 kg, modéré, sans déficit : 2 759 − 8 × 15,5 = 2 635 kcal
    expect(await kcal(ctx, "2026-11-23")).toBeCloseTo(2635, 9);
    expect(await kcal(ctx, "2026-11-22")).toBeCloseTo(2209, 9);
    expect(await propositionMaintien(ctx)).toBe(false);
  });

  it("une fois refusée, elle ne revient pas, même après une nouvelle Pesée", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-22", poidsKg: 72 }, AUJOURDHUI);
    await refuserMaintien(ctx);

    expect(await propositionMaintien(ctx)).toBe(false);
    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 71.5 }, AUJOURDHUI);
    expect(await propositionMaintien(ctx)).toBe(false);
    expect(await lireProfil(ctx)).toMatchObject({ objectif: { sens: "perdre" } });
  });

  it("revient si l'utilisateur se fixe un nouveau Poids cible et l'atteint", async () => {
    await enregistrerPesee(ctx, { jour: "2026-11-22", poidsKg: 72 }, AUJOURDHUI);
    await refuserMaintien(ctx);
    const profil = (await lireProfil(ctx))!;
    await enregistrerProfil(ctx, { ...profil, objectif: { sens: "perdre", poidsCibleKg: 70, rythme: 0.25 } }, AUJOURDHUI);
    expect(await propositionMaintien(ctx)).toBe(false);

    await enregistrerPesee(ctx, { jour: "2026-11-23", poidsKg: 70 }, AUJOURDHUI);
    expect(await propositionMaintien(ctx)).toBe(true);
  });
});
