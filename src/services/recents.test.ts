import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { creerUtilisateur } from "@/test/utilisateurs";
import { ALIMENTS_TEST } from "@/test/aliments";
import {
  ajouterEntree,
  chercherAliments,
  enregistrerProfil,
  lireRecents,
  modifierEntree,
  type Contexte,
  type QuantiteSaisie,
  type SaisieProfil,
} from "@/services";
import { aliment } from "@/db/schema";
import { importerAlimentsGeneriques } from "@/sources/ciqual";

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
const INSTANT = new Date("2026-11-23T11:00:00Z");

describe("Récents", () => {
  let ctx: Contexte;
  beforeEach(async () => {
    const db = await createTestDb();
    await importerAlimentsGeneriques(db, ALIMENTS_TEST);
    ctx = { db, userId: await creerUtilisateur(db, "moi@exemple.fr") };
    await enregistrerProfil(ctx, PROFIL, INSTANT);
  });

  async function idDe(texte: string) {
    const [a] = await chercherAliments(ctx, texte);
    return a.id;
  }

  async function noter(texte: string, quantite: QuantiteSaisie = { unite: "g", valeur: 100 }, jour = "2026-11-23") {
    return ajouterEntree(ctx, { jour, repas: "dejeuner", alimentId: await idDe(texte), quantite }, INSTANT);
  }

  const noms = async () => (await lireRecents(ctx)).map((r) => r.aliment.nom);

  it("sont vides tant que rien n'est noté", async () => {
    expect(await lireRecents(ctx)).toEqual([]);
  });

  it("donnent les Aliments notés, du plus récemment noté au plus ancien, avec leur dernière quantité", async () => {
    await noter("pomme crue", { unite: "g", valeur: 150 });
    await noter("riz blanc cuit", { unite: "g", valeur: 200 });
    await noter("lait demi", { unite: "ml", valeur: 250 });

    expect(await lireRecents(ctx)).toEqual([
      {
        aliment: { id: expect.any(String), type: "generique", nom: "Lait demi-écrémé, pasteurisé", marque: null, kcal: 46.4, unite: "g" },
        quantite: { unite: "ml", valeur: 250 },
      },
      { aliment: expect.objectContaining({ nom: "Riz blanc, cuit, sans sel ajouté" }), quantite: { unite: "g", valeur: 200 } },
      { aliment: expect.objectContaining({ nom: "Pomme, chair et peau, crue" }), quantite: { unite: "g", valeur: 150 } },
    ]);
  });

  it("gardent les 20 derniers Aliments distincts, sans doublon", async () => {
    const autres = Array.from({ length: 21 }, (_, i) => ({ ...ALIMENTS_TEST[1], code: `T${i}`, nom: `Fruit numéro ${i + 1}` }));
    await importerAlimentsGeneriques(ctx.db, autres);
    for (const { nom } of autres) {
      const [a] = (await chercherAliments(ctx, nom)).filter((r) => r.nom === nom);
      await ajouterEntree(ctx, { jour: "2026-11-22", repas: "diner", alimentId: a.id, quantite: { unite: "g", valeur: 80 } }, INSTANT);
      await ajouterEntree(ctx, { jour: "2026-11-23", repas: "diner", alimentId: a.id, quantite: { unite: "g", valeur: 90 } }, INSTANT);
    }

    const recents = await lireRecents(ctx);
    expect(recents).toHaveLength(20);
    expect(recents[0]).toMatchObject({ aliment: { nom: "Fruit numéro 21" }, quantite: { unite: "g", valeur: 90 } });
    expect(recents[19].aliment.nom).toBe("Fruit numéro 2");
    expect(new Set(recents.map((r) => r.aliment.id)).size).toBe(20);
  });

  it("remontent en tête un Aliment noté de nouveau, avec sa nouvelle quantité", async () => {
    await noter("pomme crue", { unite: "g", valeur: 150 });
    await noter("riz blanc cuit");
    await noter("pomme crue", { unite: "g", valeur: 120 }, "2026-11-20");

    expect(await noms()).toEqual(["Pomme, chair et peau, crue", "Riz blanc, cuit, sans sel ajouté"]);
    expect((await lireRecents(ctx))[0].quantite).toEqual({ unite: "g", valeur: 120 });
  });

  it("gardent la quantité de la dernière Entrée après sa modification", async () => {
    const { id } = await noter("pomme crue", { unite: "g", valeur: 150 });
    await modifierEntree(ctx, id, { quantite: { unite: "g", valeur: 175 } });

    expect((await lireRecents(ctx))[0].quantite).toEqual({ unite: "g", valeur: 175 });
  });

  it("ne proposent plus un Aliment supprimé", async () => {
    const { alimentId } = await noter("pomme crue");
    await noter("riz blanc cuit");
    await ctx.db.delete(aliment).where(eq(aliment.id, alimentId!));

    expect(await noms()).toEqual(["Riz blanc, cuit, sans sel ajouté"]);
  });

  it("sont propres à chaque utilisateur", async () => {
    await noter("pomme crue");
    const autre = { db: ctx.db, userId: await creerUtilisateur(ctx.db, "autre@exemple.fr") };

    expect(await lireRecents(autre)).toEqual([]);
  });

  it("qui correspondent à la recherche passent en tête des résultats, sans doublon", async () => {
    // Sans Récent, « pomme » donne d'abord la pomme crue.
    expect((await chercherAliments(ctx, "pomme")).map((a) => a.nom)[0]).toBe("Pomme, chair et peau, crue");
    await noter("pomme de terre bouillie");
    await noter("pomme primeur");
    await noter("riz blanc cuit");

    const resultats = (await chercherAliments(ctx, "pomme")).map((a) => a.nom);
    expect(resultats.slice(0, 3)).toEqual([
      "Pomme de terre nouvelle ou primeur, bouillie/cuite à l'eau",
      "Pomme de terre, bouillie/cuite à l'eau",
      "Pomme, chair et peau, crue",
    ]);
    expect(resultats).not.toContain("Riz blanc, cuit, sans sel ajouté");
    expect(new Set(resultats).size).toBe(resultats.length);
  });

  it("passent en tête même si une source est en panne", async () => {
    await noter("riz blanc cuit");
    const enPanne = { chercher: () => Promise.reject(new Error("panne")), trouverParCodeBarres: async () => null };

    expect((await chercherAliments(ctx, "riz", [enPanne])).map((a) => a.nom)).toEqual(["Riz blanc, cuit, sans sel ajouté"]);
  });
});
