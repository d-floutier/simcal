import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import { importerAlimentsGeneriques } from "@/sources/ciqual";
import {
  ajouterEntree,
  ajouterVerre,
  chercherAliments,
  enregistrerPesee,
  enregistrerProfil,
  JourFutur,
  lireHydratation,
  lireReglagesHydratation,
  modifierReglagesHydratation,
  ReglagesHydratationInvalides,
  retirerVerre,
  type Contexte,
  type SaisieProfil,
} from "@/services";

const PROFIL: SaisieProfil = {
  sexe: "femme",
  dateNaissance: "2001-06-15",
  tailleCm: 165,
  poidsKg: 60,
  niveauActivite: "sedentaire",
  fuseau: "Europe/Paris",
  objectif: { sens: "maintenir" },
  repartition: { glucides: 50, proteines: 20, lipides: 30 },
};

/** Midi à Paris, le jour donné. */
const midi = (jour: string) => new Date(`${jour}T11:00:00Z`);
const AUJOURDHUI = "2026-11-23";

describe("Hydratation", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, PROFIL, midi("2026-11-01"));
  });

  it("un Verre ajoute 250 ml par défaut à l'Hydratation du jour, comparée à 2 L", async () => {
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));

    expect(await lireHydratation(ctx, AUJOURDHUI)).toEqual({
      jour: AUJOURDHUI,
      totalMl: 500,
      objectifMl: 2000,
      verreMl: 250,
      ajouts: 2,
    });
  });

  it("retirer un Verre annule le dernier ajout du jour, même si la taille du Verre a changé", async () => {
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));
    await modifierReglagesHydratation(ctx, { objectifMl: 2000, verreMl: 330 }, midi(AUJOURDHUI));
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));
    await ajouterVerre(ctx, "2026-11-22", midi(AUJOURDHUI));

    await retirerVerre(ctx, AUJOURDHUI);
    expect((await lireHydratation(ctx, AUJOURDHUI)).totalMl).toBe(250);
    await retirerVerre(ctx, AUJOURDHUI);
    expect(await lireHydratation(ctx, AUJOURDHUI)).toMatchObject({ totalMl: 0, ajouts: 0 });
    await retirerVerre(ctx, AUJOURDHUI);
    expect((await lireHydratation(ctx, AUJOURDHUI)).totalMl).toBe(0);
    expect((await lireHydratation(ctx, "2026-11-22")).totalMl).toBe(330);
  });

  it("l'Objectif d'hydratation est conservé jour par jour, même quand le Profil ou une Pesée change l'objectif", async () => {
    const objectif = async (jour: string) => (await lireHydratation(ctx, jour)).objectifMl;
    await modifierReglagesHydratation(ctx, { objectifMl: 2500, verreMl: 300 }, midi("2026-11-10"));
    await enregistrerProfil(ctx, { ...PROFIL, poidsKg: 61 }, midi("2026-11-15"));
    await enregistrerPesee(ctx, { jour: "2026-11-12", poidsKg: 60.5 }, midi("2026-11-16"));
    await modifierReglagesHydratation(ctx, { objectifMl: 3000, verreMl: 300 }, midi(AUJOURDHUI));

    expect(await objectif("2026-10-15")).toBe(2000);
    expect(await objectif("2026-11-05")).toBe(2000);
    expect(await objectif("2026-11-10")).toBe(2500);
    expect(await objectif("2026-11-12")).toBe(2500);
    expect(await objectif("2026-11-20")).toBe(2500);
    expect(await objectif(AUJOURDHUI)).toBe(3000);
    expect(await lireReglagesHydratation(ctx)).toEqual({ objectifMl: 3000, verreMl: 300 });
  });

  it("l'Hydratation d'un jour passé peut être notée, un jour futur est refusé", async () => {
    // 23 h 30 à Paris le 23 : c'est déjà le 24 en UTC+14, mais pas pour l'utilisatrice.
    const soir = new Date("2026-11-23T22:30:00Z");
    await ajouterVerre(ctx, "2026-11-20", soir);

    await expect(ajouterVerre(ctx, "2026-11-24", soir)).rejects.toBeInstanceOf(JourFutur);
    expect((await lireHydratation(ctx, "2026-11-20")).totalMl).toBe(250);
    expect((await lireHydratation(ctx, "2026-11-24")).totalMl).toBe(0);
  });

  it("les Entrées du Journal ne comptent jamais dans l'Hydratation", async () => {
    await importerAlimentsGeneriques(ctx.db, ALIMENTS_TEST);
    const [lait] = await chercherAliments(ctx, "lait demi-écrémé");
    await ajouterEntree(
      ctx,
      { jour: AUJOURDHUI, repas: "petit-dejeuner", alimentId: lait.id, quantite: { unite: "ml", valeur: 250 } },
      midi(AUJOURDHUI),
    );
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));

    expect(await lireHydratation(ctx, AUJOURDHUI)).toMatchObject({ totalMl: 250, ajouts: 1 });
  });

  it("refuse un Objectif d'hydratation ou une taille de Verre hors bornes, sans rien changer", async () => {
    const essai = modifierReglagesHydratation(ctx, { objectifMl: 0, verreMl: 12.5 }, midi(AUJOURDHUI));

    await expect(essai).rejects.toEqual(new ReglagesHydratationInvalides(["objectifMl", "verreMl"]));
    expect(await lireReglagesHydratation(ctx)).toEqual({ objectifMl: 2000, verreMl: 250 });
  });

  it("chacun ne voit et ne retire que ses propres Verres", async () => {
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };
    await enregistrerProfil(autre, PROFIL, midi("2026-11-01"));
    await ajouterVerre(ctx, AUJOURDHUI, midi(AUJOURDHUI));

    await retirerVerre(autre, AUJOURDHUI);
    expect((await lireHydratation(ctx, AUJOURDHUI)).totalMl).toBe(250);
    expect((await lireHydratation(autre, AUJOURDHUI)).totalMl).toBe(0);
  });
});
