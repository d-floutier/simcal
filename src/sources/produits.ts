import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { normaliserRecherche } from "@/core";
import type { Db } from "@/db/client";
import { aliment, cacheRechercheOff, portion } from "@/db/schema";
import { chercherEnBase } from "./ciqual";
import type { ClientOpenFoodFacts, ProduitOff } from "./open-food-facts";
import type { AlimentResume, SourceAliments } from "./source";

/** Une recherche Open Food Facts reste en cache 24 h. */
export const DUREE_CACHE_MS = 24 * 60 * 60 * 1000;

const PREFIXE = "off-";

/**
 * L'identifiant d'un Produit trouvé chez Open Food Facts mais pas encore gardé en base. Il est
 * gardé (garderProduit) quand l'utilisateur l'ouvre pour le noter.
 */
export const idProduitAGarder = (code: string) => PREFIXE + code;
export const codeProduitAGarder = (id: string): string | null =>
  id.startsWith(PREFIXE) && /^\d{8,14}$/.test(id.slice(PREFIXE.length)) ? id.slice(PREFIXE.length) : null;

const resume = {
  id: aliment.id,
  type: aliment.type,
  nom: aliment.nom,
  marque: aliment.marque,
  kcal: aliment.kcal,
  unite: aliment.unite,
};
const estProduit = eq(aliment.type, "produit");

/** La source des Produits déjà gardés en base : partagés, retrouvés même quand Open Food Facts est en panne. */
export function sourceProduitsGardes(db: Db): SourceAliments {
  return {
    chercher: (texte) => chercherEnBase(db, texte, estProduit),
    trouverParCodeBarres: (code) => produitGarde(db, code),
  };
}

/**
 * La source Open Food Facts. Les Produits déjà gardés en base gardent leur identifiant (pas de
 * doublon) ; les autres reçoivent un identifiant `idProduitAGarder`. Trouver par Code-barres
 * garde le Produit en base, avec ses Portions.
 */
export function sourceOpenFoodFacts(db: Db, client: ClientOpenFoodFacts): SourceAliments {
  return {
    async chercher(texte) {
      const produits = await chercherAvecCache(db, client, texte);
      if (produits.length === 0) return [];
      const gardes = await db
        .select({ ...resume, code: aliment.codeSource })
        .from(aliment)
        .where(and(estProduit, inArray(aliment.codeSource, produits.map((p) => p.code))));
      const parCode = new Map(gardes.map(({ code, ...a }) => [code, a]));
      return produits.map(
        (p): AlimentResume =>
          parCode.get(p.code) ?? {
            id: idProduitAGarder(p.code),
            type: "produit",
            nom: p.nom,
            marque: p.marque,
            kcal: p.valeurs.kcal,
            unite: p.unite,
          },
      );
    },
    async trouverParCodeBarres(code) {
      const garde = await produitGarde(db, code);
      if (garde) return garde;
      // Un Produit vu dans une recherche récente n'a pas besoin d'être relu chez Open Food Facts.
      const produit = (await produitEnCache(db, code)) ?? (await client.lireProduit(code));
      return produit ? garderEnBase(db, produit) : null;
    },
  };
}

async function produitGarde(db: Db, code: string): Promise<AlimentResume | null> {
  const [a] = await db.select(resume).from(aliment).where(and(estProduit, eq(aliment.codeSource, code)));
  return a ?? null;
}

async function chercherAvecCache(db: Db, client: ClientOpenFoodFacts, texte: string): Promise<ProduitOff[]> {
  const cle = normaliserRecherche(texte);
  if (cle === "") return [];
  const limite = new Date(Date.now() - DUREE_CACHE_MS);
  const [enCache] = await db.select().from(cacheRechercheOff).where(eq(cacheRechercheOff.texte, cle));
  if (enCache && enCache.creeLe > limite) return enCache.produits;

  // Une erreur remonte sans rien mettre en cache : la prochaine recherche réessaiera.
  const produits = await client.chercher(cle);
  await db.delete(cacheRechercheOff).where(lt(cacheRechercheOff.creeLe, limite));
  await db
    .insert(cacheRechercheOff)
    .values({ texte: cle, produits })
    .onConflictDoUpdate({ target: cacheRechercheOff.texte, set: { produits, creeLe: sql`now()` } });
  return produits;
}

async function produitEnCache(db: Db, code: string): Promise<ProduitOff | null> {
  const [ligne] = await db
    .select({ produits: cacheRechercheOff.produits })
    .from(cacheRechercheOff)
    .where(sql`${cacheRechercheOff.produits} @> ${JSON.stringify([{ code }])}::jsonb`)
    .orderBy(desc(cacheRechercheOff.creeLe))
    .limit(1);
  return ligne?.produits.find((p) => p.code === code) ?? null;
}

/** Garde un Produit en base (une seule fois par Code-barres), avec ses Portions. */
async function garderEnBase(db: Db, p: ProduitOff): Promise<AlimentResume> {
  return db.transaction(async (tx) => {
    const [insere] = await tx
      .insert(aliment)
      .values({
        type: "produit",
        codeSource: p.code,
        codeBarres: p.code,
        nom: p.nom,
        // La marque est cherchable aussi (« ferrero » trouve le Nutella gardé).
        nomRecherche: normaliserRecherche(`${p.nom} ${p.marque ?? ""}`),
        marque: p.marque,
        unite: p.unite,
        ...p.valeurs,
      })
      .onConflictDoNothing({ target: [aliment.type, aliment.codeSource] })
      .returning(resume);
    if (!insere) return (await produitGarde(tx as unknown as Db, p.code))!;
    if (p.portions.length > 0) {
      await tx.insert(portion).values(p.portions.map((x) => ({ alimentId: insere.id, nom: x.nom, grammes: x.grammes })));
    }
    return insere;
  });
}
