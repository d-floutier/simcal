import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import {
  enregistrerProfil,
  lireProfil,
  objectifDuJour,
  SaisieProfilInvalide,
  type SaisieProfil,
} from "@/services";
import type { Contexte } from "@/services";

// Un homme de 30 ans le 2026-11-23 : Dépense de repos 1 780, Dépense totale 2 759,
// Objectif calorique 2 209 kcal en perdant 0,5 kg par semaine.
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

describe("Profil et Objectif", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  it("un nouvel utilisateur n'a ni Profil ni objectif", async () => {
    expect(await lireProfil(ctx)).toBeNull();
    expect(await objectifDuJour(ctx, "2026-11-23")).toBeNull();
  });

  it("enregistrer le Profil fixe l'objectif à partir d'aujourd'hui", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-23"));

    expect(await lireProfil(ctx)).toEqual(SAISIE);
    const objectif = await objectifDuJour(ctx, "2026-11-23");
    expect(objectif?.kcal).toBeCloseTo(2209, 9);
    expect(objectif?.macros.proteines).toBeCloseTo(110.45, 9);
    expect(await objectifDuJour(ctx, "2026-11-22")).toBeNull();
  });

  it("modifier le Profil ne change pas l'objectif d'un jour passé", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-20"));
    await enregistrerProfil(ctx, { ...SAISIE, poidsKg: 90 }, midi("2026-11-23"));

    expect((await objectifDuJour(ctx, "2026-11-20"))?.kcal).toBeCloseTo(2209, 9);
    expect((await objectifDuJour(ctx, "2026-11-22"))?.kcal).toBeCloseTo(2209, 9);
    // 90 kg : Dépense de repos 1 880, Dépense totale 2 914, objectif 2 364
    expect((await objectifDuJour(ctx, "2026-11-23"))?.kcal).toBeCloseTo(2364, 9);
    expect((await objectifDuJour(ctx, "2026-12-15"))?.kcal).toBeCloseTo(2364, 9);
  });

  it("modifier l'Objectif ou la Répartition crée aussi un nouvel objectif à partir d'aujourd'hui", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-20"));
    await enregistrerProfil(
      ctx,
      { ...SAISIE, objectif: { sens: "maintenir" }, repartition: { glucides: 40, proteines: 30, lipides: 30 } },
      midi("2026-11-23"),
    );

    const passe = await objectifDuJour(ctx, "2026-11-21");
    expect(passe?.kcal).toBeCloseTo(2209, 9);
    expect(passe?.macros.proteines).toBeCloseTo(110.45, 9);
    const aujourdhui = await objectifDuJour(ctx, "2026-11-23");
    expect(aujourdhui?.kcal).toBeCloseTo(2759, 9);
    expect(aujourdhui?.macros.proteines).toBeCloseTo(206.925, 9);
    expect(await lireProfil(ctx)).toMatchObject({ objectif: { sens: "maintenir" } });
  });

  it("deux modifications le même jour ne laissent que la dernière pour ce jour", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-23"));
    await enregistrerProfil(ctx, { ...SAISIE, poidsKg: 90 }, new Date("2026-11-23T20:00:00Z"));

    expect((await objectifDuJour(ctx, "2026-11-23"))?.kcal).toBeCloseTo(2364, 9);
    expect(await lireProfil(ctx)).toMatchObject({ poidsKg: 90 });
  });

  it("« aujourd'hui » suit le fuseau du Profil", async () => {
    // 23 h 30 UTC le 23 = 0 h 30 le 24 à Paris
    const { jour } = await enregistrerProfil(ctx, SAISIE, new Date("2026-11-23T23:30:00Z"));

    expect(jour).toBe("2026-11-24");
    expect(await objectifDuJour(ctx, "2026-11-23")).toBeNull();
  });

  it("l'âge, donc l'objectif, suit le jour demandé sans nouvel enregistrement", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-23"));

    expect((await objectifDuJour(ctx, "2026-12-31"))?.age).toBe(30);
    // 31 ans le 1er janvier : 5 kcal de moins au repos
    expect((await objectifDuJour(ctx, "2027-01-01"))?.depenseRepos).toBe(1775);
  });

  it("les objectifs d'un utilisateur ne sont pas visibles par un autre", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-23"));
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };

    expect(await lireProfil(autre)).toBeNull();
    expect(await objectifDuJour(autre, "2026-11-23")).toBeNull();
  });

  it("refuse une Répartition qui ne totalise pas 100 % sans rien enregistrer", async () => {
    await enregistrerProfil(ctx, SAISIE, midi("2026-11-20"));

    const saisie = { ...SAISIE, poidsKg: 90, repartition: { glucides: 50, proteines: 20, lipides: 20 } };
    await expect(enregistrerProfil(ctx, saisie, midi("2026-11-23"))).rejects.toThrow(
      expect.objectContaining({ champs: ["repartition"] }),
    );
    expect(await lireProfil(ctx)).toEqual(SAISIE);
    expect((await objectifDuJour(ctx, "2026-11-23"))?.kcal).toBeCloseTo(2209, 9);
  });

  it.each<[string, Partial<SaisieProfil>]>([
    ["dateNaissance", { dateNaissance: "2027-01-01" }],
    ["dateNaissance", { dateNaissance: "pas une date" }],
    ["tailleCm", { tailleCm: 0 }],
    ["poidsKg", { poidsKg: Number.NaN }],
    ["fuseau", { fuseau: "Mars/Olympus" }],
    ["poidsCibleKg", { objectif: { sens: "perdre", poidsCibleKg: -1, rythme: 0.5 } }],
    ["rythme", { objectif: { sens: "prendre", poidsCibleKg: 90, rythme: 2 as 0.5 } }],
  ])("refuse un champ %s invalide", async (champ, modif) => {
    const erreur = await enregistrerProfil(ctx, { ...SAISIE, ...modif }, midi("2026-11-23")).catch((e) => e);
    expect(erreur).toBeInstanceOf(SaisieProfilInvalide);
    expect(erreur.champs).toEqual([champ]);
    expect(await lireProfil(ctx)).toBeNull();
  });
});
