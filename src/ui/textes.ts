// Tous les textes de l'interface, en français, regroupés ici pour une traduction future.
import type { Repas } from "@/core";

export const textes = {
  app: {
    nom: "Simcal",
    description: "Votre suivi nutritionnel personnel",
  },
  repas: {
    "petit-dejeuner": "Petit-déjeuner",
    dejeuner: "Déjeuner",
    diner: "Dîner",
    collations: "Collations",
  } satisfies Record<Repas, string>,
  champs: {
    email: "Email",
    motDePasse: "Mot de passe",
  },
  connexion: {
    titre: "Connexion",
    bouton: "Se connecter",
    enCours: "Connexion…",
    pasDeCompte: "Pas encore de compte ?",
    lienInscription: "Créer un compte",
    identifiantsInvalides: "Email ou mot de passe incorrect.",
  },
  inscription: {
    titre: "Créer un compte",
    bouton: "Créer mon compte",
    enCours: "Création…",
    dejaUnCompte: "Déjà un compte ?",
    lienConnexion: "Se connecter",
    aideMotDePasse: "8 caractères minimum.",
    nonAutorisee:
      "L'accès à Simcal est sur invitation : cet email ne fait pas partie de la liste autorisée.",
    dejaInscrit: "Un compte existe déjà avec cet email. Connectez-vous.",
    motDePasseTropCourt: "Le mot de passe doit contenir au moins 8 caractères.",
    emailInvalide: "Cet email n'est pas valide.",
  },
  erreurs: {
    inattendue: "Une erreur est survenue. Réessayez dans un instant.",
  },
  navigation: {
    deconnexion: "Se déconnecter",
  },
  journal: {
    titre: "Journal",
    aujourdhui: "Aujourd'hui",
    repasVide: "Rien de noté pour l'instant.",
  },
  horsLigne: {
    indicateur: "Hors ligne",
    saisieImpossible:
      "Pas de connexion : rien n'a été enregistré. Une connexion est nécessaire pour noter.",
    pageTitre: "Pas de connexion",
    pageTexte: "Simcal a besoin d'une connexion pour afficher et noter vos repas.",
    reessayer: "Réessayer",
  },
} as const;

export function formaterJourLong(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, j)));
}
