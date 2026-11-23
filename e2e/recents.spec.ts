import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("renoter un Récent avec sa dernière quantité", async ({ page }, testInfo) => {
  await creerCompte(page, `recents-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  // Rien n'est encore noté : pas de Récents.
  await page.getByRole("link", { name: "Ajouter au déjeuner" }).click();
  const recents = page.getByRole("region", { name: "Récents" });
  await expect(recents).toContainText("Les aliments que vous notez apparaîtront ici.");

  await page.getByLabel("Rechercher un aliment").fill("riz blanc cuit");
  await page.getByRole("link", { name: /Riz blanc, cuit, sans sel ajouté/ }).click();
  await page.getByLabel("Quantité").fill("180");
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();
  await expect(page).toHaveURL(/\/\?jour=/);

  // Avant même de taper, le riz est proposé avec ses 180 g.
  await page.getByRole("link", { name: "Ajouter au dîner" }).click();
  const riz = recents.getByRole("link", { name: /Riz blanc, cuit, sans sel ajouté/ });
  await expect(riz).toContainText(/180\s?g/);
  await riz.click();
  await expect(page.getByLabel("Quantité")).toHaveValue("180");
  await page.getByRole("button", { name: "Ajouter au Journal" }).click();

  // 180 g × 1,55 = 279 kcal
  await expect(page.getByRole("region", { name: "Dîner" }).getByLabel("Total dîner")).toHaveText(/279\s?kcal/);

  // En tapant, le Récent passe en tête des résultats.
  await page.getByRole("link", { name: "Ajouter au dîner" }).click();
  await page.getByLabel("Rechercher un aliment").fill("riz");
  await expect(page.getByRole("region", { name: "Résultats" }).getByRole("link").first()).toContainText(
    "Riz blanc, cuit, sans sel ajouté",
  );
});
