import type { AlimentGenerique } from "@/sources/ciqual";

/** Quelques Aliments génériques réels de CIQUAL 2025 (valeurs pour 100 g). */
export const ALIMENTS_TEST: AlimentGenerique[] = [
  { code: "19410", nom: "Crème 30% MG, épaisse, rayon frais", kcal: 285, proteines: 2.32, glucides: 1.38, lipides: 29.9, sucres: 1.38, fibres: 0, satures: 19.5, sel: 0.065 },
  { code: "13039", nom: "Pomme, chair et peau, crue", kcal: 54, proteines: 0.25, glucides: 11.6, lipides: 0.25, sucres: 10.6, fibres: 1.4, satures: 0.052, sel: 0.0037 },
  { code: "4003", nom: "Pomme de terre, bouillie/cuite à l'eau", kcal: 81, proteines: 1.8, glucides: 16.8, lipides: 0.34, sucres: 0.86, fibres: 1.8, satures: 0.094, sel: 0.051 },
  { code: "4007", nom: "Pomme de terre nouvelle ou primeur, bouillie/cuite à l'eau", kcal: 71.6, proteines: 1.44, glucides: 15, lipides: 0.3, sucres: 1, fibres: 1.6, satures: null, sel: 0.025 },
  { code: "9104", nom: "Riz blanc, cuit, sans sel ajouté", kcal: 155, proteines: 3.15, glucides: 33.2, lipides: 0.7, sucres: 0, fibres: 1.4, satures: 0.17, sel: 0.045 },
  { code: "9100", nom: "Riz blanc, cru", kcal: 350, proteines: 7.02, glucides: 77.5, lipides: 0.79, sucres: 0.12, fibres: 1.53, satures: 0.16, sel: 0.0079 },
  { code: "19042", nom: "Lait demi-écrémé, pasteurisé", kcal: 46.4, proteines: 3.19, glucides: 4.9, lipides: 1.54, sucres: 4.81, fibres: 0, satures: 1.06, sel: 0.078 },
];

