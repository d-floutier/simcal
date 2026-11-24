import { expect, type Page } from "@playwright/test";

export const MOT_DE_PASSE = "mot-de-passe-solide";

export async function remplirIdentifiants(page: Page, email: string, motDePasse = MOT_DE_PASSE) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
}

export async function creerCompte(page: Page, email: string) {
  await page.goto("/inscription");
  await remplirIdentifiants(page, email);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
}

/** Un 1er janvier il y a 30 ans : l'âge vaut 30 ans toute l'année en cours. */
export function naissanceTrenteAns(): string {
  return `${new Date().getFullYear() - 30}-01-01`;
}

/**
 * Remplit la première configuration : un homme de 30 ans, 180 cm, 80 kg, activité modérée,
 * qui veut perdre 0,5 kg par semaine jusqu'à 72 kg. Son Objectif calorique est de 2 209 kcal.
 */
export async function remplirPremiereConfiguration(page: Page) {
  await expect(page).toHaveURL("/configuration");
  await page.getByLabel("Date de naissance").fill(naissanceTrenteAns());
  await page.getByRole("radio", { name: "Homme" }).check();
  await page.getByLabel("Taille (cm)").fill("180");
  await page.getByLabel("Poids (kg)", { exact: true }).fill("80");
  await page.getByRole("radio", { name: /Modéré/ }).check();
  await page.getByRole("radio", { name: "Perdre du poids" }).check();
  await page.getByLabel("Poids cible (kg)").fill("72");
  await page.getByRole("radio", { name: "0,5 kg par semaine" }).check();
}
