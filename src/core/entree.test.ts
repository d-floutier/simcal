import { describe, expect, it } from "vitest";
import { quantiteEnGrammes, resteDuJour, totauxDuJour, valeursEntree, type ValeursNutritionnelles } from "@/core";

// Crème fraîche épaisse (Ciqual 19410), pour 100 g
const CREME: ValeursNutritionnelles = {
  kcal: 292,
  proteines: 2.4,
  glucides: 3.1,
  lipides: 30,
  sucres: 3.1,
  fibres: null,
  satures: 19.8,
  sel: 0.08,
};

describe("quantiteEnGrammes", () => {
  it("garde une quantité en grammes", () => {
    expect(quantiteEnGrammes({ unite: "g", valeur: 125 })).toBe(125);
  });

  it("compte 1 ml pour 1 g", () => {
    expect(quantiteEnGrammes({ unite: "ml", valeur: 250 })).toBe(250);
  });

  it("multiplie le nombre de Portions par le poids d'une Portion", () => {
    expect(quantiteEnGrammes({ unite: "portion", nombre: 1.5, grammesParPortion: 300 })).toBe(450);
  });
});

describe("valeursEntree", () => {
  it("ramène les valeurs pour 100 g à la quantité notée", () => {
    const v = valeursEntree(CREME, 30);
    expect(v.kcal).toBeCloseTo(87.6, 9);
    expect(v.proteines).toBeCloseTo(0.72, 9);
    expect(v.glucides).toBeCloseTo(0.93, 9);
    expect(v.lipides).toBeCloseTo(9, 9);
    expect(v.satures).toBeCloseTo(5.94, 9);
    expect(v.sel).toBeCloseTo(0.024, 9);
  });

  it("laisse inconnu un nutriment facultatif inconnu", () => {
    expect(valeursEntree(CREME, 30).fibres).toBeNull();
  });

  it("ne garde aucun arrondi", () => {
    expect(valeursEntree({ ...CREME, kcal: 52 }, 33).kcal).toBeCloseTo(17.16, 12);
  });
});

describe("totauxDuJour", () => {
  const macros = (kcal: number, proteines: number, glucides: number, lipides: number) => ({
    kcal,
    proteines,
    glucides,
    lipides,
  });

  it("additionne les Entrées de chaque Repas et du jour", () => {
    const t = totauxDuJour([
      { repas: "petit-dejeuner", valeurs: macros(300, 10, 40, 8) },
      { repas: "petit-dejeuner", valeurs: macros(87.6, 0.72, 0.93, 9) },
      { repas: "diner", valeurs: macros(500, 30, 50, 20) },
    ]);
    expect(t.parRepas["petit-dejeuner"].kcal).toBeCloseTo(387.6, 9);
    expect(t.parRepas["petit-dejeuner"].lipides).toBeCloseTo(17, 9);
    expect(t.parRepas.diner).toEqual(macros(500, 30, 50, 20));
    expect(t.jour.kcal).toBeCloseTo(887.6, 9);
    expect(t.jour.proteines).toBeCloseTo(40.72, 9);
    expect(t.jour.glucides).toBeCloseTo(90.93, 9);
  });

  it("donne zéro pour un Repas ou un jour sans Entrée", () => {
    const t = totauxDuJour([]);
    expect(t.parRepas.dejeuner).toEqual(macros(0, 0, 0, 0));
    expect(t.parRepas.collations).toEqual(macros(0, 0, 0, 0));
    expect(t.jour).toEqual(macros(0, 0, 0, 0));
  });
});

describe("resteDuJour", () => {
  const objectif = { kcal: 2209, macros: { glucides: 276.125, proteines: 110.45, lipides: 73.633 } };

  it("soustrait les totaux du jour de l'objectif du jour", () => {
    const r = resteDuJour(objectif, { kcal: 887.6, proteines: 40.72, glucides: 90.93, lipides: 37 });
    expect(r.kcal).toBeCloseTo(1321.4, 9);
    expect(r.proteines).toBeCloseTo(69.73, 9);
    expect(r.glucides).toBeCloseTo(185.195, 9);
    expect(r.lipides).toBeCloseTo(36.633, 9);
  });

  it("devient négatif quand l'objectif est dépassé", () => {
    expect(resteDuJour(objectif, { kcal: 2500, proteines: 0, glucides: 0, lipides: 0 }).kcal).toBe(-291);
  });
});
