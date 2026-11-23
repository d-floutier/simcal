import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { midi, PROFIL_TEST, remplirDonneesPersonnelles } from "@/test/donnees";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import { sourcePersonnalises } from "@/sources/personnalises";
import {
  AlimentIntrouvable,
  ConfirmationSuppressionIncorrecte,
  EntreeIntrouvable,
  PortionIntrouvable,
  SaisieEntreeInvalide,
  ajouterEntree,
  ajouterPortion,
  ajouterVerre,
  chercherAliments,
  enregistrerPesee,
  enregistrerProfil,
  exporterDonnees,
  lireAliment,
  lireEntree,
  lireHydratation,
  lireJournal,
  lireProfil,
  lireRecents,
  lireReglagesHydratation,
  listerAjoutsHydratation,
  listerAlimentsPersonnalises,
  listerPesees,
  modifierAlimentPersonnalise,
  modifierEntree,
  modifierPortion,
  modifierReglagesHydratation,
  objectifDuJour,
  objectifHydratationDuJour,
  passerEnMaintien,
  propositionMaintien,
  refuserMaintien,
  retirerVerre,
  statistiques,
  supprimerAlimentPersonnalise,
  supprimerCompte,
  supprimerEntree,
  supprimerPesee,
  supprimerPortion,
  type Contexte,
  type ExportDonnees,
} from "@/services";

const JOUR = "2026-11-22";
const sansDate = (d: ExportDonnees) => ({ ...d, exporteLe: null });

/**
 * Deux utilisateurs, A et B. B passe par chaque service avec les identifiants des données de A :
 * il ne lit rien de A, et rien de ce qu'il écrit ne change les données de A.
 */
describe("Isolation entre deux utilisateurs", () => {
  let a: Contexte;
  let b: Contexte;
  let donneesA: Awaited<ReturnType<typeof remplirDonneesPersonnelles>>;
  let exportAvant: ExportDonnees;

  beforeAll(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    a = { db, userId: await creerUtilisateur(db, "a@exemple.fr") };
    b = { db, userId: await creerUtilisateur(db, "b@exemple.fr") };
    donneesA = await remplirDonneesPersonnelles(a);
    exportAvant = await exporterDonnees(a);
  });

  it("B ne lit aucune donnée de A", async () => {
    const { soupe, entreeSoupe } = donneesA;
    expect(await lireProfil(b)).toBeNull();
    expect(await objectifDuJour(b, JOUR)).toBeNull();
    expect(await objectifHydratationDuJour(b, JOUR)).toBe(2000);
    expect(await lireReglagesHydratation(b)).toEqual({ objectifMl: 2000, verreMl: 250 });
    expect((await lireJournal(b, JOUR)).repas.flatMap((r) => r.entrees)).toEqual([]);
    expect(await lireEntree(b, entreeSoupe.id)).toBeNull();
    expect(await listerPesees(b)).toEqual([]);
    expect(await lireHydratation(b, JOUR)).toMatchObject({ totalMl: 0, ajouts: 0 });
    expect(await listerAjoutsHydratation(b)).toEqual([]);
    expect(await listerAlimentsPersonnalises(b)).toEqual([]);
    expect(await lireAliment(b, soupe.id)).toBeNull();
    expect(await chercherAliments(b, "soupe")).toEqual([]);
    expect(await sourcePersonnalises(b.db, b.userId).trouverParCodeBarres("12345670")).toBeNull();
    expect(await lireRecents(b)).toEqual([]);
    expect(await propositionMaintien(b)).toBe(false);
    const stats = await statistiques(b, { jours: 7 }, midi("2026-11-23"));
    expect(stats.jours.every((j) => j.kcal === null)).toBe(true);
    expect(stats.pesees).toEqual([]);
    expect(await exporterDonnees(b)).toMatchObject({
      compte: { email: "b@exemple.fr" },
      profil: null,
      objectifs: [],
      entrees: [],
      pesees: [],
      hydratation: [],
      alimentsPersonnalises: [],
    });
  });

  it("B ne peut ni modifier ni supprimer les données de A, ni s'en servir", async () => {
    const { soupe, bol, pomme, entreeSoupe } = donneesA;
    const saisieSoupe = { nom: "Volée", unite: "g" as const, valeurs: { kcal: 1, proteines: 0, glucides: 0, lipides: 0 } };

    await expect(modifierEntree(b, entreeSoupe.id, { repas: "collations" })).rejects.toThrow(EntreeIntrouvable);
    await expect(modifierEntree(b, entreeSoupe.id, { quantite: { unite: "g", valeur: 1 } })).rejects.toThrow(EntreeIntrouvable);
    await expect(supprimerEntree(b, entreeSoupe.id)).rejects.toThrow(EntreeIntrouvable);
    await expect(modifierAlimentPersonnalise(b, soupe.id, saisieSoupe)).rejects.toThrow(AlimentIntrouvable);
    await expect(supprimerAlimentPersonnalise(b, soupe.id)).rejects.toThrow(AlimentIntrouvable);
    await expect(ajouterPortion(b, soupe.id, { nom: "1 louche", grammes: 100 })).rejects.toThrow(AlimentIntrouvable);
    await expect(modifierPortion(b, bol.id, { nom: "1 dé", grammes: 1 })).rejects.toThrow(PortionIntrouvable);
    await expect(supprimerPortion(b, bol.id)).rejects.toThrow(PortionIntrouvable);
    await expect(supprimerCompte(b, "a@exemple.fr")).rejects.toThrow(ConfirmationSuppressionIncorrecte);

    // B a son propre Profil pour noter : il ne peut pas noter l'Aliment de A ni sa Portion.
    await enregistrerProfil(b, { ...PROFIL_TEST, poidsKg: 90 }, midi("2026-11-20"));
    await expect(
      ajouterEntree(b, { jour: JOUR, repas: "diner", alimentId: soupe.id, quantite: { unite: "g", valeur: 100 } }, midi(JOUR)),
    ).rejects.toThrow(SaisieEntreeInvalide);
    await expect(
      ajouterEntree(
        b,
        { jour: JOUR, repas: "diner", alimentId: pomme.id, quantite: { unite: "portion", portionId: bol.id, nombre: 1 } },
        midi(JOUR),
      ),
    ).rejects.toThrow(SaisieEntreeInvalide);

    // Les écritures de B sur ses propres données, aux mêmes jours que A, ne touchent pas A.
    await enregistrerPesee(b, { jour: "2026-11-21", poidsKg: 89 }, midi(JOUR));
    await supprimerPesee(b, "2026-11-21");
    await enregistrerPesee(b, { jour: "2026-11-21", poidsKg: 61 }, midi(JOUR));
    await refuserMaintien(b);
    await passerEnMaintien(b, midi(JOUR));
    await modifierReglagesHydratation(b, { objectifMl: 3000, verreMl: 500 }, midi(JOUR));
    await ajouterVerre(b, JOUR, midi(JOUR));
    await retirerVerre(b, JOUR);
    await retirerVerre(b, JOUR);
    await ajouterEntree(b, { jour: JOUR, repas: "diner", alimentId: pomme.id, quantite: { unite: "g", valeur: 80 } }, midi(JOUR));

    expect(sansDate(await exporterDonnees(a))).toEqual(sansDate(exportAvant));
  });
});
