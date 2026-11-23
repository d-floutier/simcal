// Tous les textes de l'interface, en français, regroupés ici pour une traduction future.
import type { NiveauActivite, Repas, Rythme, SensObjectif, Sexe } from "@/core";
import type { ChampProfil } from "@/services";

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
    journal: "Journal",
    reglages: "Réglages",
  },
  journal: {
    titre: "Journal",
    aujourdhui: "Aujourd'hui",
    repasVide: "Rien de noté pour l'instant.",
    objectifDuJour: "Objectif du jour",
  },
  configuration: {
    titre: "Bienvenue sur Simcal",
    intro:
      "Quelques informations sur vous pour calculer votre Objectif calorique. Vous pourrez tout modifier ensuite dans les réglages.",
  },
  reglages: {
    titre: "Réglages",
    intro: "Un changement s'applique à partir d'aujourd'hui : les jours passés gardent leur objectif.",
    enregistre: "Enregistré. Votre nouvel objectif s'applique à partir d'aujourd'hui.",
  },
  profil: {
    sectionProfil: "Votre profil",
    sectionObjectif: "Votre objectif de poids",
    sectionMacros: "Répartition des macros",
    dateNaissance: "Date de naissance",
    sexe: "Sexe pour le calcul",
    sexeExplication:
      "Les formules qui estiment vos dépenses ne sont pas les mêmes pour un homme et pour une femme. Cette information ne sert qu'à ce calcul.",
    sexes: { homme: "Homme", femme: "Femme" } satisfies Record<Sexe, string>,
    tailleCm: "Taille (cm)",
    poidsKg: "Poids (kg)",
    niveauActivite: "Niveau d'activité",
    niveaux: {
      sedentaire: { nom: "Sédentaire", description: "Travail assis, peu ou pas de sport." },
      leger: { nom: "Léger", description: "Marche régulière ou sport 1 à 3 fois par semaine." },
      modere: { nom: "Modéré", description: "Sport 3 à 5 fois par semaine, ou métier debout." },
      intense: { nom: "Intense", description: "Sport 6 à 7 fois par semaine, ou métier physique." },
    } satisfies Record<NiveauActivite, { nom: string; description: string }>,
    fuseau: "Fuseau horaire",
    fuseauAide: "Il fixe le changement de jour dans votre Journal.",
    sens: "Objectif",
    sensOptions: {
      perdre: "Perdre du poids",
      maintenir: "Maintenir mon poids",
      prendre: "Prendre du poids",
    } satisfies Record<SensObjectif, string>,
    poidsCibleKg: "Poids cible (kg)",
    rythme: "Rythme",
    rythmes: {
      0.25: "0,25 kg par semaine",
      0.5: "0,5 kg par semaine",
      0.75: "0,75 kg par semaine",
    } satisfies Record<Rythme, string>,
    macros: { glucides: "Glucides", proteines: "Protéines", lipides: "Lipides" },
    pourcentage: (macro: string) => `${macro} (%)`,
    totalRepartition: (total: number) =>
      `La Répartition totalise ${formaterNombre(total)} % : elle doit faire 100 %.`,
    bouton: "Enregistrer",
    enCours: "Enregistrement…",
    erreurs: {
      sexe: "Choisissez le sexe pour le calcul.",
      dateNaissance: "Indiquez une date de naissance passée valide.",
      tailleCm: "Indiquez une taille entre 50 et 272 cm.",
      poidsKg: "Indiquez un poids entre 20 et 500 kg.",
      niveauActivite: "Choisissez un niveau d'activité.",
      fuseau: "Choisissez un fuseau horaire.",
      sens: "Choisissez un objectif.",
      poidsCibleKg: "Indiquez un Poids cible entre 20 et 500 kg.",
      rythme: "Choisissez un Rythme.",
      repartition: "La Répartition des macros doit totaliser 100 %.",
    } satisfies Record<ChampProfil, string>,
    erreurGenerale: "Certains champs sont à corriger.",
  },
  objectif: {
    titre: "Votre objectif",
    depenseRepos: "Dépense de repos",
    depenseTotale: "Dépense totale",
    objectifCalorique: "Objectif calorique",
    incomplet: "Remplissez votre profil pour voir votre objectif.",
    plancherApplique: (plancher: number) =>
      `Votre Objectif calorique a été relevé au plancher de sécurité (${formaterKcal(plancher)}) : le Rythme choisi demanderait de manger moins, ce qui n'est pas recommandé. Choisissez un Rythme plus doux pour un objectif atteignable.`,
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

/** Les arrondis se font uniquement à l'affichage. */
export function formaterNombre(n: number, decimales = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimales }).format(n);
}

export function formaterKcal(kcal: number): string {
  return `${formaterNombre(Math.round(kcal))} kcal`;
}

export function formaterGrammes(g: number): string {
  return `${formaterNombre(Math.round(g))} g`;
}
