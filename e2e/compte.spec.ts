import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { creerCompte, remplirPremiereConfiguration } from "./aides";

test("exporter ses données, puis supprimer son compte après confirmation et se réinscrire", async ({
  page,
}, testInfo) => {
  const email = `compte-${testInfo.project.name}@exemple.fr`;
  await creerCompte(page, email);
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL("/");

  // L'export se télécharge en JSON, avec le Profil.
  await page.goto("/reglages");
  const telechargement = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exporter mes données" }).click();
  const fichier = await telechargement;
  expect(fichier.suggestedFilename()).toMatch(/^simcal-export-\d{4}-\d{2}-\d{2}\.json$/);
  const donnees = JSON.parse(await readFile((await fichier.path())!, "utf8"));
  expect(donnees).toMatchObject({ format: "simcal-export", version: 1, compte: { email }, profil: { poidsKg: 80 } });

  // La suppression demande de retaper l'email ; une erreur ne supprime rien.
  await page.getByRole("button", { name: "Supprimer mon compte…" }).click();
  const confirmation = page.getByLabel(/Pour confirmer, retapez votre email/);
  await confirmation.fill("quelqu-un@exemple.fr");
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page.getByText("Ce n'est pas l'email de votre compte : rien n'a été supprimé.")).toBeVisible();
  await expect(page).toHaveURL("/reglages");

  await confirmation.fill(email);
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL("/connexion");

  // La session est fermée.
  await page.goto("/");
  await expect(page).toHaveURL("/connexion");

  // L'email, toujours dans la liste autorisée, peut se réinscrire : tout recommence.
  await creerCompte(page, email);
  await expect(page).toHaveURL("/configuration");
});
