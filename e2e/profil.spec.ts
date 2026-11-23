import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("la première configuration est obligatoire, puis le Journal affiche l'objectif du jour", async ({
  page,
}, testInfo) => {
  await creerCompte(page, `profil-${testInfo.project.name}@exemple.fr`);

  // Tant que le Profil n'est pas complet, le Journal renvoie vers la configuration.
  await expect(page).toHaveURL("/configuration");
  await page.goto("/");
  await expect(page).toHaveURL("/configuration");

  await remplirPremiereConfiguration(page);
  const resume = page.getByRole("region", { name: "Votre objectif" });
  await expect(resume).toContainText(/Dépense de repos\s*1\s?780\s?kcal/);
  await expect(resume).toContainText(/Dépense totale\s*2\s?759\s?kcal/);
  await expect(resume).toContainText(/Objectif calorique\s*2\s?209\s?kcal/);
  await expect(resume).toContainText(/Glucides\s*276\s?g/);
  await expect(resume).toContainText(/Protéines\s*110\s?g/);
  await expect(resume).toContainText(/Lipides\s*74\s?g/);
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await expect(page).toHaveURL("/");
  const objectif = page.getByRole("region", { name: "Objectif du jour" });
  await expect(objectif).toContainText(/2\s?209\s?kcal/);
  await expect(objectif).toContainText(/Protéines\s*0\s?g\s*\/\s*110\s?g/);

  // Dans les réglages : une Répartition qui ne fait pas 100 % est signalée, le plancher expliqué.
  await page.getByRole("link", { name: "Réglages" }).click();
  await expect(page).toHaveURL("/reglages");
  await page.getByLabel("Protéines (%)").fill("30");
  await expect(page.getByRole("alert").filter({ hasText: "110 %" })).toBeVisible();
  await page.getByLabel("Glucides (%)").fill("40");
  await page.getByLabel("Poids (kg)", { exact: true }).fill("60");
  await page.getByRole("radio", { name: /Sédentaire/ }).check();
  await page.getByRole("radio", { name: "0,75 kg par semaine" }).check();
  await expect(page.getByText(/plancher de sécurité/)).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Enregistré" })).toBeVisible();

  await page.getByRole("link", { name: "Journal" }).click();
  // 60 kg : Dépense de repos 1 580 kcal, qui sert de plancher
  await expect(page.getByRole("region", { name: "Objectif du jour" })).toContainText(/1\s?580\s?kcal/);
});
