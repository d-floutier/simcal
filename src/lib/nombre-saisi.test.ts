import { describe, expect, it } from "vitest";
import { lireNombreSaisi, nombreDuFormulaire } from "./nombre-saisi";

describe("nombre saisi", () => {
  it("accepte la virgule ou le point décimal, et les espaces autour", () => {
    expect(lireNombreSaisi(" 72,5 ")).toBe(72.5);
    expect(lireNombreSaisi("72.5")).toBe(72.5);
  });

  it("vaut NaN quand il est vide ou illisible", () => {
    expect(lireNombreSaisi("  ")).toBeNaN();
    expect(lireNombreSaisi("abc")).toBeNaN();
  });

  it("se lit dans un formulaire, NaN quand le champ manque", () => {
    const formData = new FormData();
    formData.set("poidsKg", "80,2");
    expect(nombreDuFormulaire(formData, "poidsKg")).toBe(80.2);
    expect(nombreDuFormulaire(formData, "absent")).toBeNaN();
  });
});
