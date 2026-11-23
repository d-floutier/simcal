import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { midi, remplirDonneesPersonnelles } from "@/test/donnees";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import { sourceCiqual } from "@/sources/ciqual";
import { fauxOpenFoodFacts } from "@/sources/open-food-facts-faux";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import {
  ajouterEntree,
  chercherAliments,
  ConfirmationSuppressionIncorrecte,
  exporterDonnees,
  garderProduit,
  lireAliment,
  lireProfil,
  sourcesParDefaut,
  supprimerCompte,
  type Contexte,
} from "@/services";

describe("Export des données", () => {
  let db: Db;
  let ctx: Contexte;
  beforeEach(async () => {
    db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
  });

  it("contient chaque type de donnée personnelle, avec la version du format et la date", async () => {
    const { soupe, bol } = await remplirDonneesPersonnelles(ctx);

    const donnees = await exporterDonnees(ctx, midi("2026-11-23"));

    expect(donnees.format).toBe("simcal-export");
    expect(donnees.version).toBe(1);
    expect(donnees.exporteLe).toBe("2026-11-23T11:00:00.000Z");
    expect(donnees.compte).toEqual({
      email: "moi@exemple.fr",
      nom: "moi@exemple.fr",
      emailVerifie: false,
      creeLe: expect.any(String),
      misAJour: expect.any(String),
    });
    expect(donnees.profil).toMatchObject({
      fuseau: "Europe/Paris",
      sexe: "femme",
      dateNaissance: "1990-05-12",
      tailleCm: 165,
      // La Pesée la plus récente met à jour le poids du Profil.
      poidsKg: 67.4,
      niveauActivite: "leger",
      sens: "perdre",
      poidsCibleKg: 62,
      rythme: 0.5,
      repartition: { glucides: 50, proteines: 20, lipides: 30 },
      objectifHydratationMl: 2500,
      verreMl: 300,
    });
    expect(donnees.objectifs.map((o) => [o.depuis, o.poidsKg, o.objectifHydratationMl])).toEqual([
      ["2026-11-20", 68, 2000],
      ["2026-11-21", 67.4, 2000],
      ["2026-11-22", 67.4, 2500],
    ]);
    expect(donnees.entrees.map((e) => [e.jour, e.repas, e.nom, e.grammes])).toEqual([
      ["2026-11-22", "dejeuner", "Pomme, chair et peau, crue", 150],
      ["2026-11-22", "diner", "Soupe maison", 600],
    ]);
    expect(donnees.entrees[1].quantite).toEqual({
      unite: "portion",
      portionId: bol.id,
      nombre: 2,
      nom: "1 bol",
      grammesParPortion: 300,
    });
    expect(donnees.pesees).toEqual([{ jour: "2026-11-21", poidsKg: 67.4 }]);
    expect(donnees.hydratation.map((a) => [a.jour, a.ml])).toEqual([
      ["2026-11-22", 300],
      ["2026-11-22", 300],
    ]);
    expect(donnees.alimentsPersonnalises).toEqual([
      expect.objectContaining({
        id: soupe.id,
        nom: "Soupe maison",
        codeBarres: "12345670",
        portions: [{ id: bol.id, nom: "1 bol", grammes: 300 }],
      }),
    ]);
  });

  it("ne contient ni mot de passe, ni jeton de session, ni identifiant interne de compte", async () => {
    await remplirDonneesPersonnelles(ctx);
    const texte = JSON.stringify(await exporterDonnees(ctx));
    expect(texte).not.toMatch(/password|motDePasse|token|jeton/i);
    expect(texte).not.toContain(ctx.userId);
  });

  it("d'un compte sans Profil, exporte des listes vides", async () => {
    const donnees = await exporterDonnees(ctx);
    expect(donnees).toMatchObject({
      profil: null,
      objectifs: [],
      entrees: [],
      pesees: [],
      hydratation: [],
      alimentsPersonnalises: [],
    });
  });
});

/** Toutes les tables du schéma. */
const TABLES: PgTable[] = Object.values(schema).filter((t) => is(t, PgTable));
const nomTable = (t: PgTable) => getTableConfig(t).name;

/**
 * Les tables personnelles, déduites du schéma : `user` et toute table qui y mène par une chaîne
 * de clés étrangères. Une nouvelle table rattachée à l'utilisateur y entre d'elle-même.
 */
function tablesPersonnelles(): PgTable[] {
  const personnelles = new Set<PgTable>(TABLES.filter((t) => t === (schema.user as PgTable)));
  let ajout = true;
  while (ajout) {
    ajout = false;
    for (const t of TABLES) {
      if (personnelles.has(t)) continue;
      const cibles = getTableConfig(t).foreignKeys.map((fk) => fk.reference().foreignTable);
      if (cibles.some((c) => personnelles.has(c))) {
        personnelles.add(t);
        ajout = true;
      }
    }
  }
  return [...personnelles];
}

/** Le contenu de chaque table, ligne par ligne, dans un ordre stable. */
async function contenu(db: Db): Promise<Record<string, string[]>> {
  const resultat: Record<string, string[]> = {};
  for (const t of TABLES) {
    const lignes = await db.select().from(t);
    resultat[nomTable(t)] = lignes.map((l) => JSON.stringify(l)).sort();
  }
  return resultat;
}

describe("Suppression du compte", () => {
  let db: Db;
  let moi: Contexte;
  let autre: Contexte;
  let produitId: string;
  beforeEach(async () => {
    db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    // Les données partagées et celles d'un autre utilisateur, qui doivent rester intactes.
    autre = { db, userId: await creerUtilisateur(db, "autre@exemple.fr") };
    await remplirDonneesPersonnelles(autre, "Compote de l'autre");
    const off = fauxOpenFoodFacts();
    const [trouve] = await chercherAliments(autre, "nutella", sourcesParDefaut(autre, { openFoodFacts: off }));
    produitId = (await garderProduit(autre, trouve.id, off))!.id;
  });

  /** Crée mon compte (utilisateur, session, mot de passe) et toutes mes données. */
  async function remplirMesDonnees() {
    moi = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await remplirDonneesPersonnelles(moi);
    await ajouterEntree(
      moi,
      { jour: "2026-11-22", repas: "collations", alimentId: produitId, quantite: { unite: "g", valeur: 15 } },
      midi("2026-11-22"),
    );
  }

  it("efface toutes les données personnelles, sans toucher aux données partagées ni à celles des autres", async () => {
    const avant = await contenu(db);
    await remplirMesDonnees();

    // Chaque table personnelle a reçu des données : sinon, ce test ne prouverait rien pour elle.
    const pendant = await contenu(db);
    const nonRemplies = tablesPersonnelles()
      .map(nomTable)
      .filter((nom) => pendant[nom].length === avant[nom].length);
    expect(nonRemplies, "tables personnelles que remplirDonneesPersonnelles ne remplit pas").toEqual([]);

    await supprimerCompte(moi, "moi@exemple.fr");

    // Il ne reste rien de mes données ; les Aliments génériques, le Produit gardé, le cache
    // Open Food Facts et les données de l'autre utilisateur sont exactement ceux d'avant.
    expect(await contenu(db)).toEqual(avant);
  });

  it("garde les Aliments génériques, les Produits et le cache Open Food Facts", async () => {
    await remplirMesDonnees();
    await supprimerCompte(moi, "moi@exemple.fr");
    expect(await lireAliment(autre, produitId)).toMatchObject({ type: "produit", nom: "Nutella" });
    expect((await db.select().from(schema.cacheRechercheOff)).length).toBeGreaterThan(0);
    expect(await chercherAliments(autre, "pomme crue", [sourceCiqual(db)])).not.toEqual([]);
  });

  it("demande de retaper l'email du compte, sans tenir compte de la casse ni des espaces", async () => {
    await remplirMesDonnees();
    await expect(supprimerCompte(moi, "")).rejects.toThrow(ConfirmationSuppressionIncorrecte);
    await expect(supprimerCompte(moi, "autre@exemple.fr")).rejects.toThrow(ConfirmationSuppressionIncorrecte);
    expect(await lireProfil(moi)).not.toBeNull();

    await supprimerCompte(moi, "  Moi@Exemple.fr ");
    expect(await lireProfil(moi)).toBeNull();
  });

  it("laisse l'email se réinscrire ensuite", async () => {
    await remplirMesDonnees();
    await supprimerCompte(moi, "moi@exemple.fr");
    const nouveau: Contexte = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    expect(nouveau.userId).not.toBe(moi.userId);
    expect(await exporterDonnees(nouveau)).toMatchObject({ profil: null, entrees: [], alimentsPersonnalises: [] });
  });
});
