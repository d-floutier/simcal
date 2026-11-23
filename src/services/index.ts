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
  type QuantiteEntree,
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
  garderProduit,
  lireAliment,
  openFoodFactsParDefaut,
  sourcesParDefaut,
  type AlimentResume,
  type FicheAliment,
  type Portion,
  type SourceAliments,
} from "./aliments";
export { lireRecents, NOMBRE_RECENTS, type Recent } from "./recents";
export {
  enregistrerPesee,
  listerPesees,
  passerEnMaintien,
  PeseeInvalide,
  propositionMaintien,
  refuserMaintien,
  supprimerPesee,
  type ChampPesee,
  type Pesee,
} from "./pesees";
export {
  AlimentIntrouvable,
  ajouterPortion,
  creerAlimentPersonnalise,
  listerAlimentsPersonnalises,
  modifierAlimentPersonnalise,
  modifierPortion,
  PortionIntrouvable,
  SaisieAlimentInvalide,
  SaisiePortionInvalide,
  supprimerAlimentPersonnalise,
  supprimerPortion,
  type ChampAlimentPersonnalise,
  type ChampPortion,
  type SaisieAlimentPersonnalise,
  type SaisiePortion,
} from "./personnalises";
export {
  ajouterVerre,
  BORNES_HYDRATATION,
  lireHydratation,
  listerAjoutsHydratation,
  lireReglagesHydratation,
  modifierReglagesHydratation,
  objectifHydratationDuJour,
  ReglagesHydratationInvalides,
  retirerVerre,
  type AjoutHydratation,
  type ChampHydratation,
  type HydratationDuJour,
  type ReglagesHydratation,
} from "./hydratation";
export {
  statistiques,
  type JourStatistiques,
  type PeriodeStatistiques,
  type Statistiques,
} from "./statistiques";
export { ConfirmationSuppressionIncorrecte, exporterDonnees, supprimerCompte, type ExportDonnees } from "./compte";
