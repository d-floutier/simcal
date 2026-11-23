// Services de l'application : le seam de test des règles métier.
// Next.js (Server Actions, pages) les appelle toujours pour l'utilisateur connecté.
export type { Contexte } from "./contexte";
export {
  ajouterEntree,
  EntreeIntrouvable,
  JourFutur,
  lireEntree,
  lireJournal,
  modifierEntree,
  SaisieEntreeInvalide,
  supprimerEntree,
  type ChampEntree,
  type Entree,
  type JournalDuJour,
  type QuantiteSaisie,
  type SaisieEntree,
} from "./journal";
export {
  enregistrerProfil,
  lireProfil,
  objectifDuJour,
  SaisieProfilInvalide,
  type ChampProfil,
  type SaisieProfil,
} from "./profil";
export {
  chercherAliments,
  lireAliment,
  sourcesParDefaut,
  type AlimentResume,
  type FicheAliment,
  type SourceAliments,
} from "./aliments";
