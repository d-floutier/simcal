import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("créer un Aliment personnalisé avec une Portion, le noter en Portions, puis le supprimer", async ({
  page,
}, testInfo) => {
  await creerCompte(page, `personnalises-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  // Créer l'Aliment : kcal et Macros obligatoires, fibres facultatives.
  await page.getByRole("link", { name: "Mes aliments" }).click();
  await page.getByRole("link", { name: "Créer un aliment" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Riz au lait maison");
  await page.getByLabel("Énergie (kcal)").fill("130");
  await page.getByLabel("Protéines (g)").fill("3,5");
  await page.getByLabel("Glucides (g)").fill("22");
  await page.getByLabel("Lipides (g)").fill("3");
  await page.getByLabel("Fibres (g)").fill("0,4");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  // Puis sa Portion : 1 bol = 300 g.
  await expect(page.getByRole("heading", { name: "Riz au lait maison" })).toBeVisible();
  await page.getByLabel("Nom de la Portion").fill("1 bol");
  await page.getByLabel("Équivaut à (g)").fill("300");
  await page.getByRole("button", { name: "Ajouter la Portion" }).click();
  await expect(page.getByRole("button", { name: "Supprimer la Portion 1 bol" })).toBeVisible();

  // Dans la recherche, il passe avant les Aliments génériques.
  await page.goto("/");
  await page.getByRole("link", { name: "Ajouter au dîner" }).click();
  await page.getByLabel("Rechercher un aliment").fill("riz");
  const resultats = page.getByRole("region", { name: "Résultats" }).getByRole("link");
  await expect(resultats.first()).toContainText("Riz au lait maison");
  await expect(resultats.nth(1)).toContainText("Riz blanc");
  await resultats.first().click();

  // Noter 1,5 bol : 450 g × 1,3 = 585 kcal.
  await expect(page.getByRole("region", { name: "Portions" })).toContainText("1 bol = 300 g");
  await page.getByLabel("Unité").selectOption({ label: "1 bol" });
  await page.getByLabel("Nombre").fill("1,5");
  await expect(page.getByRole("table", { name: "Pour cette quantité" })).toContainText(/Énergie\s*585\s?kcal/);
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);
  const diner = page.getByRole("region", { name: "Dîner" });
  await expect(diner).toContainText("1,5 × 1 bol (450 g)");
  await expect(diner.getByLabel("Total dîner")).toHaveText(/585\s?kcal/);

  // Supprimer l'Aliment : l'Entrée reste, avec ses valeurs.
  await page.getByRole("link", { name: "Mes aliments" }).click();
  await page.getByRole("link", { name: /Riz au lait maison/ }).click();
  await page.getByRole("button", { name: "Supprimer l'aliment" }).click();
  await expect(page).toHaveURL("/mes-aliments");
  await expect(page.getByText("Aucun Aliment personnalisé pour l'instant.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Dîner" }).getByLabel("Total dîner")).toHaveText(/585\s?kcal/);
});
