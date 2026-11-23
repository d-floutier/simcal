import { describe, expect, it } from "vitest";
import { estRepas, estUniteAliment } from "@/core";

describe("valeurs lues dans un formulaire", () => {
  it("reconnaissent les quatre Repas, et rien d'autre", () => {
    expect(["petit-dejeuner", "dejeuner", "diner", "collations"].every(estRepas)).toBe(true);
    expect(estRepas("gouter")).toBe(false);
    expect(estRepas(null)).toBe(false);
  });

  it("reconnaissent les unités d'un Aliment, g ou ml", () => {
    expect(estUniteAliment("g")).toBe(true);
    expect(estUniteAliment("ml")).toBe(true);
    expect(estUniteAliment("kg")).toBe(false);
    expect(estUniteAliment(null)).toBe(false);
  });
});
