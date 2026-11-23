import { describe, expect, it } from "vitest";
import { ecartPoidsCible, poidsCibleAtteint } from "@/core";

const perdre = { sens: "perdre", poidsCibleKg: 72, rythme: 0.5 } as const;
const prendre = { sens: "prendre", poidsCibleKg: 65, rythme: 0.25 } as const;

describe("poidsCibleAtteint", () => {
  it("en perdant : atteint au Poids cible ou en dessous, pas au-dessus", () => {
    expect(poidsCibleAtteint(perdre, 72.1)).toBe(false);
    expect(poidsCibleAtteint(perdre, 72)).toBe(true);
    expect(poidsCibleAtteint(perdre, 71.4)).toBe(true);
  });

  it("en prenant : atteint au Poids cible ou au-dessus, pas en dessous", () => {
    expect(poidsCibleAtteint(prendre, 64.9)).toBe(false);
    expect(poidsCibleAtteint(prendre, 65)).toBe(true);
    expect(poidsCibleAtteint(prendre, 66.2)).toBe(true);
  });

  it("en maintenant, il n'y a pas de Poids cible à atteindre", () => {
    expect(poidsCibleAtteint({ sens: "maintenir" }, 80)).toBe(false);
  });
});

describe("ecartPoidsCible", () => {
  it("donne les kg qui restent à perdre ou à prendre, zéro une fois atteint", () => {
    expect(ecartPoidsCible(perdre, 80)).toBeCloseTo(8, 9);
    expect(ecartPoidsCible(prendre, 61.5)).toBeCloseTo(3.5, 9);
    expect(ecartPoidsCible(perdre, 70)).toBe(0);
    expect(ecartPoidsCible(prendre, 70)).toBe(0);
  });

  it("n'a pas de sens en maintenant", () => {
    expect(ecartPoidsCible({ sens: "maintenir" }, 80)).toBeNull();
  });
});
