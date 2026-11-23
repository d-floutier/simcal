import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = "mot-de-passe-solide";

async function remplir(page: Page, email: string, motDePasse = MOT_DE_PASSE) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
}

async function attendreJournalVide(page: Page) {
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Journal" })).toBeVisible();
  for (const repas of ["Petit-déjeuner", "Déjeuner", "Dîner", "Collations"]) {
    await expect(page.getByRole("region", { name: repas, exact: true })).toContainText("Rien de noté");
  }
}

test("les pages de l'app sont inaccessibles sans connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/connexion");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("un email non autorisé est refusé avec un message clair", async ({ page }) => {
  await page.goto("/inscription");
  await remplir(page, "inconnu@exemple.fr");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "sur invitation" })).toBeVisible();
  await expect(page).toHaveURL("/inscription");
});

test("un invité crée son compte, se déconnecte et se reconnecte", async ({ page, context }, testInfo) => {
  const email = `invite-${testInfo.project.name}@exemple.fr`;

  await page.goto("/inscription");
  await remplir(page, email);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await attendreJournalVide(page);

  // La session est persistante (cookie daté, pas un cookie de session) : elle survit
  // à la fermeture du navigateur sur mobile.
  const cookie = (await context.cookies()).find((c) => c.name.endsWith("session_token"));
  expect(cookie?.expires ?? -1).toBeGreaterThan(Date.now() / 1000 + 7 * 24 * 3600);
  await page.reload();
  await attendreJournalVide(page);

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/connexion");
  await page.goto("/");
  await expect(page).toHaveURL("/connexion");

  await remplir(page, email, "mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();

  await remplir(page, email);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await attendreJournalVide(page);
});
