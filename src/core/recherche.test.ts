import { describe, expect, it } from "vitest";
import { normaliserRecherche } from "@/core";

describe("normaliserRecherche", () => {
  it("ignore les accents et la casse", () => {
    expect(normaliserRecherche("Crème FRAÎCHE")).toBe(normaliserRecherche("creme fraiche"));
    expect(normaliserRecherche("Œuf à la coque")).toBe("oeuf a la coque");
  });

  it("réduit la ponctuation et les espaces à un seul espace", () => {
    expect(normaliserRecherche("  Riz blanc,   cuit (aliment moyen) ")).toBe("riz blanc cuit aliment moyen");
  });
});
