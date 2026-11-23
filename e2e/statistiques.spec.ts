import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("les statistiques montrent des jours vides sans Entrée et la courbe des Pesées avec le Poids cible", async ({
  page,
}, testInfo) => {
  await creerCompte(page, `stats-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("link", { name: "Pesées" }).click();
  await page.getByLabel("Poids (kg)").fill("79.2");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Pesée enregistrée" })).toBeVisible();

  await page.getByRole("link", { name: "Stats" }).click();
  await expect(page).toHaveURL("/statistiques");
  await expect(page.getByRole("heading", { name: "Statistiques" })).toBeVisible();
  await expect(page.getByRole("link", { name: "7 jours" })).toHaveAttribute("aria-current", "page");

  // Sans Entrée, chaque jour reste vide (pas de colonne à 0 kcal) et il n'y a pas de moyenne.
  const kcal = page.getByRole("region", { name: "Kcal par jour" });
  await expect(kcal.locator("[data-jour]")).toHaveCount(7);
  await expect(kcal.locator("[data-vide]")).toHaveCount(7);
  await expect(page.getByRole("region", { name: "Moyenne des Macros" })).toContainText(
    "Aucun jour avec Entrée sur la période.",
  );

  const poids = page.getByRole("region", { name: "Poids" });
  await expect(poids.getByRole("img")).toHaveAccessibleName(/1 Pesée sur la période.*Poids cible : 72 kg/);
  await poids.getByText("Voir les valeurs").click();
  await expect(poids.getByRole("table")).toContainText("79,2 kg");

  await page.getByRole("link", { name: "30 jours" }).click();
  await expect(page).toHaveURL("/statistiques?periode=30");
  await expect(kcal.locator("[data-jour]")).toHaveCount(30);
});
