import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

// Le scan est simulé par la saisie manuelle du code ; la fausse source Open Food Facts
// (SIMCAL_OPEN_FOOD_FACTS=faux) connaît le Nutella.
test("scanner un Produit, puis un code introuvable lié ensuite à un Aliment personnalisé", async ({
  page,
}, testInfo) => {
  await creerCompte(page, `scan-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  // Un code reconnu ouvre directement la saisie de quantité.
  await page.getByRole("link", { name: "Ajouter au déjeuner" }).click();
  await page.getByRole("link", { name: "Scanner un code-barres" }).click();
  await expect(page.getByRole("button", { name: "Scanner avec la caméra" })).toBeVisible();
  await page.getByLabel("Code-barres").fill("3017624010701");
  await page.getByRole("button", { name: "Chercher ce code" }).click();
  await expect(page.getByRole("heading", { name: "Nutella" })).toBeVisible();
  await page.getByLabel("Unité").selectOption({ label: "1 portion" });
  await page.getByLabel("Nombre").fill("1");
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);
  await expect(page.getByRole("region", { name: "Déjeuner" }).getByLabel("Total déjeuner")).toHaveText(/81\s?kcal/);

  // Un code introuvable propose de créer un Aliment personnalisé lié à ce code.
  await page.getByRole("link", { name: "Ajouter au dîner" }).click();
  await page.getByRole("link", { name: "Scanner un code-barres" }).click();
  await page.getByLabel("Code-barres").fill("3560070000001");
  await page.getByRole("button", { name: "Chercher ce code" }).click();
  await expect(page.getByText("Aucun aliment trouvé pour le code 3560070000001.")).toBeVisible();
  await page.getByRole("link", { name: "Créer un aliment avec ce code" }).click();
  await expect(page.getByLabel("Code-barres (facultatif)")).toHaveValue("3560070000001");
  await page.getByLabel("Nom", { exact: true }).fill("Biscuits de la boulangerie");
  await page.getByLabel("Énergie (kcal)").fill("450");
  await page.getByLabel("Protéines (g)").fill("7");
  await page.getByLabel("Glucides (g)").fill("65");
  await page.getByLabel("Lipides (g)").fill("18");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name: "Biscuits de la boulangerie" })).toBeVisible();

  // Le scan suivant du même code le retrouve.
  await page.goto("/");
  await page.getByRole("link", { name: "Ajouter au dîner" }).click();
  await page.getByRole("link", { name: "Scanner un code-barres" }).click();
  await page.getByLabel("Code-barres").fill("3560070000001");
  await page.getByRole("button", { name: "Chercher ce code" }).click();
  await expect(page.getByRole("heading", { name: "Biscuits de la boulangerie" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter au Journal" })).toBeVisible();
});
