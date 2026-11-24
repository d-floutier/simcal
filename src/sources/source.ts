import type { TypeAliment, UniteAliment } from "@/db/schema";

/** Un résultat de recherche : de quoi choisir un Aliment avant d'ouvrir sa fiche. */
export type AlimentResume = {
  id: string;
  type: TypeAliment;
  nom: string;
  marque: string | null;
  /** kcal pour 100 g (ou 100 ml selon `unite`). */
  kcal: number;
  unite: UniteAliment;
};

/**
 * Une source d'Aliments (CIQUAL, Aliments personnalisés, Open Food Facts…). Chaque source
 * renvoie des Aliments déjà gardés en base (avec leur `id`), pour qu'une Entrée puisse les copier.
 */
export interface SourceAliments {
  /** Cherche par texte (en français, sans tenir compte des accents ni de la casse). */
  chercher(texte: string): Promise<AlimentResume[]>;
  /** Trouve un Aliment par son Code-barres, ou null. */
  trouverParCodeBarres(code: string): Promise<AlimentResume | null>;
}
