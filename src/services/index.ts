// Services de l'application : le seam de test des règles métier.
// Next.js (Server Actions, pages) les appelle toujours pour l'utilisateur connecté.
export type { Contexte } from "./contexte";
export { lireJournal, type JournalDuJour, type Entree } from "./journal";
export {
  enregistrerProfil,
  lireProfil,
  objectifDuJour,
  SaisieProfilInvalide,
  type ChampProfil,
  type SaisieProfil,
} from "./profil";
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
