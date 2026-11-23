import { expect, test } from "@playwright/test";
import { remplirPremiereConfiguration } from "./aides";

test("l'app expose un manifeste installable (nom, icônes, couleur)", async ({ page, request }) => {
  await page.goto("/connexion");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const manifeste = await (await request.get(href!)).json();
  expect(manifeste).toMatchObject({ name: "Simcal", short_name: "Simcal", display: "standalone", start_url: "/" });
  expect(manifeste.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  const tailles = manifeste.icons.map((i: { sizes: string }) => i.sizes);
  expect(tailles).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icone of manifeste.icons) {
    const reponse = await request.get(icone.src);
    expect(reponse.ok()).toBe(true);
    expect(reponse.headers()["content-type"]).toBe("image/png");
  }

  // iOS : icône d'écran d'accueil et mode plein écran.
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect((await request.get(appleIcon!)).ok()).toBe(true);
  await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute("content", "yes");
});

test("hors ligne, un indicateur de déconnexion s'affiche puis disparaît au retour du réseau", async ({ page, context }) => {
  await page.goto("/connexion");
  const indicateur = page.getByRole("status").filter({ hasText: "Hors ligne" });
  await expect(indicateur).toBeHidden();

  await context.setOffline(true);
  await expect(indicateur).toBeVisible();

  await context.setOffline(false);
  await expect(indicateur).toBeHidden();
});

test("une saisie tentée hors ligne affiche un message clair et n'envoie rien", async ({ page, context }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("quelquun@exemple.fr");
  await page.getByLabel("Mot de passe").fill("mot-de-passe-solide");

  const envois: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") envois.push(r.url());
  });

  await context.setOffline(true);
  await page.getByRole("button", { name: "Se connecter" }).click();

  const alerte = page.getByRole("alert").filter({ hasText: "Une connexion est nécessaire" });
  await expect(alerte).toContainText("rien n'a été enregistré");
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
  await expect(page).toHaveURL("/connexion");
  expect(envois).toEqual([]);

  await context.setOffline(false);
  await expect(alerte).toBeHidden();
});

test("le service worker met en cache l'interface seulement, et hors ligne l'app s'ouvre quand même", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Playwright ne pilote les service workers que sous Chromium");

  await page.goto("/inscription");
  await page.getByLabel("Email").fill(`pwa-${testInfo.project.name}@exemple.fr`);
  await page.getByLabel("Mot de passe").fill("mot-de-passe-solide");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await remplirPremiereConfiguration(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Journal" })).toBeVisible();

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Journal" })).toBeVisible();

  const enCache = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const nom of await caches.keys()) {
      for (const requete of await (await caches.open(nom)).keys()) urls.push(new URL(requete.url).pathname);
    }
    return urls;
  });
  expect(enCache).toContain("/~offline");
  const autorises = /^\/(~offline|_next\/static\/.+|[\w-]+\.(png|svg|ico))$/;
  expect(enCache.filter((url) => !autorises.test(url))).toEqual([]);

  await context.setOffline(true);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pas de connexion" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Hors ligne" })).toBeVisible();
  await expect(page.getByText("Journal")).toBeHidden();
});
