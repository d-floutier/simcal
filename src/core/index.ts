// Noyau nutritionnel : module pur, sans base de données ni framework.
export { dateUTC, estJourValide, jourCalendaire, jourDecale, type Jour } from "./jour";
export { ecartPoidsCible, poidsCibleAtteint } from "./poids-cible";
export { REPAS, type Repas } from "./repas";
export {
  age,
  calculerObjectif,
  ciblesMacros,
  depenseDeRepos,
  depenseTotale,
  NIVEAUX_ACTIVITE,
  objectifCalorique,
  REPARTITION_PAR_DEFAUT,
  RepartitionInvalide,
  RYTHMES,
  SENS_OBJECTIF,
  totalRepartition,
  type NiveauActivite,
  type Objectif,
  type ObjectifCalcule,
  type ParametresObjectif,
  type Repartition,
  type ResultatObjectifCalorique,
  type Rythme,
  type SensObjectif,
  type Sexe,
} from "./objectif";
export {
  NUTRIMENTS_FACULTATIFS,
  quantiteEnGrammes,
  resteDuJour,
  totauxDuJour,
  valeursEntree,
  type Macros,
  type NutrimentsFacultatifs,
  type Quantite,
  type TotauxDuJour,
  type ValeursNutritionnelles,
} from "./entree";
export { normaliserRecherche } from "./recherche";
export { joursDeLaPeriode, moyenneMacros, totauxParJour } from "./statistiques";
export { kcalDepuisKj, KJ_PAR_KCAL } from "./energie";
