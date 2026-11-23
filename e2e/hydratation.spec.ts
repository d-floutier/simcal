import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("ajouter et retirer un Verre depuis le Journal, puis régler l'Objectif d'hydratation et le Verre", async ({
  page,
  context,
}, testInfo) => {
  await creerCompte(page, `hydratation-${testInfo.project.name}@exemple.fr`);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  const hydratation = page.getByRole("region", { name: "Hydratation" });
  await expect(hydratation).toContainText("0 L / 2 L");
  const ajouter = hydratation.getByRole("button", { name: "Ajouter un Verre de 250 ml" });
  await ajouter.click();
  await expect(hydratation).toContainText("0,25 L / 2 L");
  await ajouter.click();
  await expect(hydratation).toContainText("0,5 L / 2 L");
  await hydratation.getByRole("button", { name: "Retirer un Verre" }).click();
  await expect(hydratation).toContainText("0,25 L / 2 L");

  // Hors ligne, le tap n'envoie rien et le dit.
  await context.setOffline(true);
  await ajouter.click();
  await expect(hydratation.getByRole("alert")).toContainText("rien n'a été enregistré");
  await context.setOffline(false);
  await page.reload();
  await expect(hydratation).toContainText("0,25 L / 2 L");

  // Un jour passé se rattrape aussi.
  await page.getByRole("link", { name: "Jour précédent" }).click();
  await expect(hydratation).toContainText("0 L / 2 L");
  await ajouter.click();
  await expect(hydratation).toContainText("0,25 L / 2 L");

  // Régler l'Objectif d'hydratation et la taille du Verre.
  await page.goto("/reglages");
  await page.getByLabel("Objectif d'hydratation (ml par jour)").fill("2500");
  await page.getByLabel("Taille du Verre (ml)").fill("330");
  await page.getByRole("button", { name: "Appliquer à l'hydratation" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Hydratation mise à jour" })).toBeVisible();

  await page.goto("/");
  await hydratation.getByRole("button", { name: "Ajouter un Verre de 330 ml" }).click();
  await expect(hydratation).toContainText("0,58 L / 2,5 L");
  // Le jour précédent garde son Objectif d'hydratation.
  await page.getByRole("link", { name: "Jour précédent" }).click();
  await expect(hydratation).toContainText("0,25 L / 2 L");
});
