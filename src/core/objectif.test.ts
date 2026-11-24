import { describe, expect, it } from "vitest";
import {
  age,
  calculerObjectif,
  ciblesMacros,
  depenseDeRepos,
  depenseTotale,
  objectifCalorique,
  REPARTITION_PAR_DEFAUT,
  RepartitionInvalide,
} from "@/core";

describe("age", () => {
  it("n'ajoute pas l'année la veille de l'anniversaire", () => {
    expect(age("1990-06-15", "2026-06-14")).toBe(35);
  });

  it("ajoute l'année le jour même de l'anniversaire", () => {
    expect(age("1990-06-15", "2026-06-15")).toBe(36);
  });
});

describe("depenseDeRepos (Mifflin-St Jeor)", () => {
  it("pour un homme : 10 × poids + 6,25 × taille − 5 × âge + 5", () => {
    expect(depenseDeRepos({ sexe: "homme", poidsKg: 80, tailleCm: 180, age: 30 })).toBe(1780);
  });

  it("pour une femme : 10 × poids + 6,25 × taille − 5 × âge − 161", () => {
    expect(depenseDeRepos({ sexe: "femme", poidsKg: 60, tailleCm: 165, age: 25 })).toBe(1345.25);
  });
});

describe("depenseTotale", () => {
  it.each([
    ["sedentaire", 2400],
    ["leger", 2750],
    ["modere", 3100],
    ["intense", 3450],
  ] as const)("multiplie la Dépense de repos par le facteur du niveau %s", (niveau, attendu) => {
    expect(depenseTotale(2000, niveau)).toBeCloseTo(attendu, 9);
  });
});

describe("objectifCalorique", () => {
  const homme = { sexe: "homme", depenseRepos: 1800, depenseTotale: 3000 } as const;

  it("« maintenir » vise la Dépense totale, sans Rythme", () => {
    expect(objectifCalorique({ ...homme, objectif: { sens: "maintenir" } })).toEqual({
      kcal: 3000,
      plancher: 1800,
      plancherApplique: false,
    });
  });

  it.each([
    [0.25, 2725],
    [0.5, 2450],
    [0.75, 2175],
  ] as const)("« perdre » à %s kg/semaine retire Rythme × 7 700 ÷ 7", (rythme, attendu) => {
    const r = objectifCalorique({ ...homme, objectif: { sens: "perdre", rythme, poidsCibleKg: 70 } });
    expect(r.kcal).toBeCloseTo(attendu, 9);
    expect(r.plancherApplique).toBe(false);
  });

  it.each([
    [0.25, 3275],
    [0.5, 3550],
    [0.75, 3825],
  ] as const)("« prendre » à %s kg/semaine ajoute Rythme × 7 700 ÷ 7", (rythme, attendu) => {
    const r = objectifCalorique({ ...homme, objectif: { sens: "prendre", rythme, poidsCibleKg: 90 } });
    expect(r.kcal).toBeCloseTo(attendu, 9);
  });
});

describe("plancher de sécurité", () => {
  it("relève l'objectif d'une femme à 1 200 kcal quand sa Dépense de repos est plus basse", () => {
    const r = objectifCalorique({
      sexe: "femme",
      depenseRepos: 1100,
      depenseTotale: 1320,
      objectif: { sens: "perdre", rythme: 0.75, poidsCibleKg: 50 },
    });
    expect(r).toEqual({ kcal: 1200, plancher: 1200, plancherApplique: true });
  });

  it("relève l'objectif d'un homme à 1 500 kcal quand sa Dépense de repos est plus basse", () => {
    const r = objectifCalorique({
      sexe: "homme",
      depenseRepos: 1300,
      depenseTotale: 1560,
      objectif: { sens: "perdre", rythme: 0.5, poidsCibleKg: 60 },
    });
    expect(r).toEqual({ kcal: 1500, plancher: 1500, plancherApplique: true });
  });

  it("relève l'objectif à la Dépense de repos quand elle dépasse le minimum", () => {
    const r = objectifCalorique({
      sexe: "homme",
      depenseRepos: 1600,
      depenseTotale: 1920,
      objectif: { sens: "perdre", rythme: 0.75, poidsCibleKg: 70 },
    });
    expect(r).toEqual({ kcal: 1600, plancher: 1600, plancherApplique: true });
  });

  it("ne signale rien quand l'objectif atteint exactement le plancher", () => {
    const r = objectifCalorique({
      sexe: "femme",
      depenseRepos: 1000,
      depenseTotale: 1200,
      objectif: { sens: "maintenir" },
    });
    expect(r).toEqual({ kcal: 1200, plancher: 1200, plancherApplique: false });
  });
});

describe("ciblesMacros", () => {
  it("convertit la Répartition en grammes à 4, 4 et 9 kcal par gramme", () => {
    const g = ciblesMacros(2000, { glucides: 40, proteines: 30, lipides: 30 });
    expect(g.glucides).toBeCloseTo(200, 9);
    expect(g.proteines).toBeCloseTo(150, 9);
    expect(g.lipides).toBeCloseTo(66.667, 3);
  });

  it("a par défaut 50 % de glucides, 20 % de protéines et 30 % de lipides", () => {
    expect(REPARTITION_PAR_DEFAUT).toEqual({ glucides: 50, proteines: 20, lipides: 30 });
  });

  it.each([
    { glucides: 50, proteines: 20, lipides: 20 },
    { glucides: 50, proteines: 30, lipides: 30 },
  ])("refuse une Répartition qui ne totalise pas 100 % (%o)", (repartition) => {
    expect(() => ciblesMacros(2000, repartition)).toThrow(RepartitionInvalide);
  });
});

describe("calculerObjectif", () => {
  it("enchaîne âge, Dépense de repos, Dépense totale, Objectif calorique et Macros pour un jour donné", () => {
    const r = calculerObjectif(
      {
        sexe: "homme",
        dateNaissance: "1996-01-01",
        tailleCm: 180,
        poidsKg: 80,
        niveauActivite: "modere",
        objectif: { sens: "perdre", poidsCibleKg: 72, rythme: 0.5 },
        repartition: REPARTITION_PAR_DEFAUT,
      },
      "2026-11-23",
    );
    expect(r.age).toBe(30);
    expect(r.depenseRepos).toBe(1780);
    expect(r.depenseTotale).toBeCloseTo(2759, 9);
    expect(r.kcal).toBeCloseTo(2209, 9);
    expect(r.plancherApplique).toBe(false);
    expect(r.macros.glucides).toBeCloseTo(276.125, 9);
    expect(r.macros.proteines).toBeCloseTo(110.45, 9);
    expect(r.macros.lipides).toBeCloseTo(73.633, 3);
  });
});
