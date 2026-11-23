import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("ajouter une Entrée par la recherche, la modifier puis la supprimer", async ({ page }, testInfo) => {
  await creerCompte(page, `journal-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Ajouter au déjeuner" }).click();
  await expect(page).toHaveURL(/\/ajouter\?jour=\d{4}-\d{2}-\d{2}&repas=dejeuner/);

  // Sans accent ni majuscule, « creme epaisse » trouve la crème épaisse de CIQUAL.
  await page.getByLabel("Rechercher un aliment").fill("creme epaisse");
  const resultat = page.getByRole("link", { name: /Crème 30% MG, épaisse, rayon frais/ });
  await expect(resultat).toContainText(/285\s?kcal pour 100 g/);
  await resultat.click();

  // La fiche : valeurs pour 100 g, nutriments facultatifs compris.
  await expect(page.getByRole("heading", { name: "Crème 30% MG, épaisse, rayon frais" })).toBeVisible();
  const fiche = page.getByRole("table", { name: "Valeurs pour 100 g" });
  await expect(fiche).toContainText(/Lipides\s*29,9\s?g/);
  await expect(fiche).toContainText(/dont acides gras saturés\s*19,5\s?g/);

  // Les kcal se mettent à jour pendant la saisie : 30 g × 2,85 = 85,5 kcal.
  await page.getByLabel("Quantité").fill("30");
  const apercu = page.getByRole("table", { name: "Pour cette quantité" });
  await expect(apercu).toContainText(/Énergie\s*86\s?kcal/);
  await expect(apercu).toContainText(/Lipides\s*9\s?g/);
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();

  await expect(page).toHaveURL(/\/\?jour=/);
  const dejeuner = page.getByRole("region", { name: "Déjeuner", exact: true });
  await expect(dejeuner).toContainText("Crème 30% MG, épaisse, rayon frais");
  await expect(dejeuner.getByLabel("Total déjeuner")).toHaveText(/86\s?kcal/);
  const resume = page.getByRole("region", { name: "Objectif du jour" });
  await expect(resume).toContainText(/Consommé\s*86\s?kcal/);
  // 2 209 − 85,5 = 2 123,5 kcal
  await expect(resume).toContainText(/Reste\s*2\s?124\s?kcal/);

  // Modifier la quantité et le Repas.
  await dejeuner.getByRole("link", { name: /Crème 30% MG/ }).click();
  await page.getByLabel("Quantité").fill("60");
  await page.getByLabel("Repas").selectOption("diner");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);
  await expect(page.getByRole("region", { name: "Déjeuner", exact: true })).toContainText("Rien de noté");
  await expect(page.getByRole("region", { name: "Dîner" }).getByLabel("Total dîner")).toHaveText(/171\s?kcal/);

  // Supprimer l'Entrée.
  await page.getByRole("region", { name: "Dîner" }).getByRole("link", { name: /Crème 30% MG/ }).click();
  await page.getByRole("button", { name: "Supprimer l'entrée" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);
  await expect(page.getByRole("region", { name: "Dîner" })).toContainText("Rien de noté");
  await expect(resume).toContainText(/Consommé\s*0\s?kcal/);

  // Les jours passés sont accessibles, pas les jours futurs.
  await page.getByRole("link", { name: "Jour précédent" }).click();
  await expect(page.getByRole("link", { name: "Jour suivant" })).toBeVisible();
  await page.getByRole("link", { name: "Jour suivant" }).click();
  await expect(page.getByRole("link", { name: "Jour suivant" })).toHaveCount(0);
});
