import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

// La fausse source Open Food Facts (SIMCAL_OPEN_FOOD_FACTS=faux) fournit le Nutella.
test("noter un Produit Open Food Facts avec sa Portion", async ({ page }, testInfo) => {
  await creerCompte(page, `produits-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Ajouter au petit-déjeuner" }).click();
  await expect(page.getByText(/Open Food Facts \(licence ODbL\)/)).toBeVisible();
  await expect(page.getByText(/Ciqual 2025, Anses \(Licence Ouverte/)).toBeVisible();
  await page.getByLabel("Rechercher un aliment").fill("nutella");
  const nutella = page.getByRole("region", { name: "Résultats" }).getByRole("link", { name: /Nutella/ });
  await expect(nutella).toContainText("Ferrero");
  await expect(nutella).toContainText(/539\s?kcal/);
  await nutella.click();

  // 2 portions de 15 g : 30 g × 5,39 = 162 kcal.
  await expect(page.getByRole("heading", { name: "Nutella" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Portions" })).toContainText("1 portion = 15 g");
  await page.getByLabel("Unité").selectOption({ label: "1 portion" });
  await page.getByLabel("Nombre").fill("2");
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);
  await expect(page.getByRole("region", { name: "Petit-déjeuner" }).getByLabel("Total petit-déjeuner")).toHaveText(
    /162\s?kcal/,
  );

  // Gardé en base, il n'apparaît qu'une fois dans la recherche.
  await page.getByRole("link", { name: "Ajouter au déjeuner" }).click();
  await page.getByLabel("Rechercher un aliment").fill("nutella");
  await expect(page.getByRole("region", { name: "Résultats" }).getByRole("link")).toHaveCount(1);
});
