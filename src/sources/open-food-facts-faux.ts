import { normaliserRecherche } from "@/core";
import type { ClientOpenFoodFacts, ProduitOff } from "./open-food-facts";

/** Quelques Produits pour les tests et les parcours e2e (valeurs pour 100 g ou 100 ml). */
export const PRODUITS_TEST: ProduitOff[] = [
  {
    code: "3017624010701",
    nom: "Nutella",
    marque: "Ferrero",
    unite: "g",
    valeurs: { kcal: 539, proteines: 6.3, glucides: 57.5, lipides: 30.9, fibres: null, sucres: 56.3, satures: 10.6, sel: 0.107 },
    portions: [{ nom: "1 portion", grammes: 15 }],
  },
  {
    code: "3428273980046",
    nom: "Lait demi-écrémé bio",
    marque: "Lactel",
    unite: "ml",
    valeurs: { kcal: 46, proteines: 3.2, glucides: 4.8, lipides: 1.6, fibres: null, sucres: 4.8, satures: 1, sel: 0.1 },
    portions: [{ nom: "1 verre", grammes: 250 }],
  },
  {
    code: "3017760000109",
    nom: "Petit Beurre",
    marque: "LU",
    unite: "g",
    // Fourni seulement en kJ (1 850 kJ) : converti par le client.
    valeurs: { kcal: 442.16, proteines: 8, glucides: 75, lipides: 12, fibres: 2.5, sucres: 22, satures: 7.5, sel: 0.85 },
    portions: [],
  },
];

export type FauxOpenFoodFacts = ClientOpenFoodFacts & { appels: { recherches: number; lectures: number } };

/**
 * Une fausse source Open Food Facts, sans réseau : c'est elle que les tests et les parcours e2e
 * utilisent (SIMCAL_OPEN_FOOD_FACTS=faux). En panne, elle échoue comme un délai dépassé.
 */
export function fauxOpenFoodFacts(opts: { produits?: ProduitOff[]; enPanne?: boolean } = {}): FauxOpenFoodFacts {
  const produits = opts.produits ?? PRODUITS_TEST;
  const appels = { recherches: 0, lectures: 0 };
  const panne = () => Promise.reject(new Error("Open Food Facts : délai dépassé (fausse source)"));
  return {
    appels,
    async chercher(texte) {
      appels.recherches++;
      if (opts.enPanne) return panne();
      const mots = normaliserRecherche(texte).split(" ").filter(Boolean);
      if (mots.length === 0) return [];
      return produits.filter((p) => {
        const nom = normaliserRecherche(`${p.nom} ${p.marque ?? ""}`).split(" ");
        return mots.every((m) => nom.some((n) => n.startsWith(m)));
      });
    },
    async lireProduit(code) {
      appels.lectures++;
      if (opts.enPanne) return panne();
      return produits.find((p) => p.code === code) ?? null;
    },
  };
}
