import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("noter une Pesée met à jour l'écart au Poids cible, puis propose de passer en « maintenir »", async ({
  page,
}, testInfo) => {
  await creerCompte(page, `pesees-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Pesées" }).click();
  await expect(page).toHaveURL("/pesees");
  await expect(page.getByText("Encore 8 kg à perdre")).toBeVisible();

  await page.getByLabel("Poids (kg)").fill("79.2");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Pesée enregistrée" })).toBeVisible();
  await expect(page.getByText("Encore 7,2 kg à perdre")).toBeVisible();
  const historique = page.getByRole("region", { name: "Historique" });
  await expect(historique.getByRole("listitem")).toHaveCount(1);
  await expect(historique).toContainText("79,2 kg");

  // Le Poids cible est atteint : Simcal propose « maintenir », et un refus est retenu.
  await page.getByLabel("Poids (kg)").fill("71.8");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Poids cible atteint", { exact: true })).toBeVisible();
  await expect(historique.getByRole("listitem")).toHaveCount(1);
  const proposition = page.getByRole("region", { name: /Poids cible atteint, bravo/ });
  await expect(proposition).toBeVisible();
  await proposition.getByRole("button", { name: "Non, garder mon Objectif" }).click();
  await expect(proposition).toBeHidden();
  await page.reload();
  await expect(page.getByText("Poids cible atteint", { exact: true })).toBeVisible();
  await expect(proposition).toBeHidden();
});
