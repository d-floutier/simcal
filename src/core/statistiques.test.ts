import { describe, expect, it } from "vitest";
import { joursDeLaPeriode, moyenneMacros, totauxParJour } from "@/core";

describe("joursDeLaPeriode", () => {
  it("donne les n jours qui finissent au jour donné, du plus ancien au plus récent", () => {
    expect(joursDeLaPeriode("2026-03-02", 3)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  });
});

describe("totauxParJour", () => {
  it("additionne les Entrées de chaque jour et laisse vide un jour sans Entrée", () => {
    const totaux = totauxParJour(
      ["2026-11-21", "2026-11-22", "2026-11-23"],
      [
        { jour: "2026-11-21", valeurs: { kcal: 300, proteines: 10, glucides: 40, lipides: 8 } },
        { jour: "2026-11-23", valeurs: { kcal: 500, proteines: 20, glucides: 60, lipides: 15 } },
        { jour: "2026-11-21", valeurs: { kcal: 200, proteines: 5, glucides: 30, lipides: 4 } },
      ],
    );

    expect(totaux).toEqual([
      { jour: "2026-11-21", total: { kcal: 500, proteines: 15, glucides: 70, lipides: 12 } },
      { jour: "2026-11-22", total: null },
      { jour: "2026-11-23", total: { kcal: 500, proteines: 20, glucides: 60, lipides: 15 } },
    ]);
  });
});

describe("moyenneMacros", () => {
  it("ne compte que les jours avec Entrée", () => {
    expect(
      moyenneMacros([
        { kcal: 2000, proteines: 100, glucides: 250, lipides: 60 },
        null,
        { kcal: 1600, proteines: 80, glucides: 190, lipides: 50 },
        null,
      ]),
    ).toEqual({ kcal: 1800, proteines: 90, glucides: 220, lipides: 55 });
  });

  it("est vide quand aucun jour n'a d'Entrée", () => {
    expect(moyenneMacros([null, null])).toBeNull();
  });
});
