// Tous les textes de l'interface, en français, regroupés ici pour une traduction future.
import type { NiveauActivite, Repas, Rythme, SensObjectif, Sexe } from "@/core";
import type { ChampEntree, ChampHydratation, ChampPesee, ChampProfil } from "@/services";

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
    pesees: "Pesées",
    statistiques: "Stats",
  },
  journal: {
    titre: "Journal",
    aujourdhui: "Aujourd'hui",
    repasVide: "Rien de noté pour l'instant.",
    objectifDuJour: "Objectif du jour",
    jourPrecedent: "Jour précédent",
    jourSuivant: "Jour suivant",
    retourAujourdhui: "Revenir à aujourd'hui",
    consomme: "Consommé",
    objectif: "Objectif",
    reste: "Reste",
    depassement: "Dépassement",
    ajouter: "Ajouter",
    ajouterA: {
      "petit-dejeuner": "Ajouter au petit-déjeuner",
      dejeuner: "Ajouter au déjeuner",
      diner: "Ajouter au dîner",
      collations: "Ajouter aux collations",
    } satisfies Record<Repas, string>,
    totalRepas: (repas: string) => `Total ${repas.toLowerCase()}`,
    sansObjectif: "Remplissez votre profil pour voir votre objectif.",
  },
  recherche: {
    titre: "Ajouter un aliment",
    pour: (repas: string, jour: string) => `${repas} · ${jour}`,
    champ: "Rechercher un aliment",
    placeholder: "Ex. : pomme, riz blanc cuit, crème…",
    aucunResultat: "Aucun aliment trouvé.",
    resultats: "Résultats",
    kcalPour100: (kcal: string, unite: "g" | "ml") => `${kcal} pour 100 ${unite}`,
  },
  aliment: {
    pour100: (unite: "g" | "ml") => `Valeurs pour 100 ${unite}`,
    introuvable: "Cet aliment n'existe pas ou n'est plus disponible.",
    energie: "Énergie",
  },
  nutriments: {
    kcal: "Énergie",
    proteines: "Protéines",
    glucides: "Glucides",
    lipides: "Lipides",
    fibres: "Fibres",
    sucres: "dont sucres",
    satures: "dont acides gras saturés",
    sel: "Sel",
  },
  entree: {
    sectionAjout: "Noter cet aliment",
    sectionModification: "Modifier l'entrée",
    quantite: "Quantité",
    unite: "Unité",
    unites: { g: "g", ml: "ml" },
    aideMillilitres: "1 ml compte pour 1 g.",
    repas: "Repas",
    apercu: "Pour cette quantité",
    ajouter: "Ajouter au Journal",
    enregistrer: "Enregistrer",
    enCours: "Enregistrement…",
    supprimer: "Supprimer l'entrée",
    suppressionEnCours: "Suppression…",
    introuvable: "Cette entrée n'existe pas.",
    alimentSupprime: "L'aliment d'origine n'existe plus : l'entrée garde ses valeurs.",
    jourFutur: "Impossible de noter sur un jour futur.",
    erreurs: {
      jour: "Ce jour n'est pas valide.",
      repas: "Choisissez un repas.",
      aliment: "Cet aliment n'est plus disponible.",
      quantite: "Indiquez une quantité supérieure à 0.",
    } satisfies Record<ChampEntree, string>,
  },
  sources: {
    ciqual:
      "Aliments génériques : Table de composition nutritionnelle des aliments Ciqual 2025, Anses (Licence Ouverte 2.0).",
    ciqualUrl: "https://doi.org/10.57745/RDMHWY",
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
  pesees: {
    titre: "Pesées",
    intro: "Votre Pesée la plus récente devient le poids de votre Profil et recalcule votre objectif à partir de son jour.",
    poidsActuel: "Poids actuel",
    poidsCible: "Poids cible",
    resteAPerdre: (kg: string) => `Encore ${kg} à perdre`,
    resteAPrendre: (kg: string) => `Encore ${kg} à prendre`,
    cibleAtteinte: "Poids cible atteint",
    nouvelle: "Noter une Pesée",
    modification: "Modifier la Pesée",
    jour: "Jour",
    poidsKg: "Poids (kg)",
    remplace: "Une Pesée déjà notée ce jour-là sera remplacée.",
    bouton: "Enregistrer",
    enCours: "Enregistrement…",
    annuler: "Annuler",
    enregistree: "Pesée enregistrée.",
    historique: "Historique",
    aucune: "Aucune Pesée pour l'instant.",
    modifier: "Modifier",
    supprimer: "Supprimer",
    supprimerLibelle: (jour: string) => `Supprimer la Pesée du ${jour}`,
    modifierLibelle: (jour: string) => `Modifier la Pesée du ${jour}`,
    erreurs: {
      jour: "Choisissez aujourd'hui ou un jour passé.",
      poidsKg: "Indiquez un poids entre 20 et 500 kg.",
    } satisfies Record<ChampPesee, string>,
    proposition: {
      titre: "Poids cible atteint, bravo !",
      texte: "Voulez-vous passer en Objectif « maintenir » ? Votre Objectif calorique sera recalculé à partir d'aujourd'hui.",
      accepter: "Passer en « maintenir »",
      refuser: "Non, garder mon Objectif",
    },
  },
  hydratation: {
    titre: "Hydratation",
    progression: (bu: string, objectif: string) => `${bu} sur ${objectif}`,
    atteint: "Objectif d'hydratation atteint",
    ajouterVerre: (verre: string) => `+ 1 Verre (${verre})`,
    ajouterVerreLibelle: (verre: string) => `Ajouter un Verre de ${verre}`,
    retirerVerre: "Retirer un Verre",
    nonCompte: "Seuls les Verres comptent : les boissons notées dans le Journal n'y entrent pas.",
    reglages: {
      titre: "Hydratation",
      intro: "Un nouvel Objectif d'hydratation s'applique à partir d'aujourd'hui. La taille du Verre vaut pour les prochains Verres.",
      objectifMl: "Objectif d'hydratation (ml par jour)",
      verreMl: "Taille du Verre (ml)",
      // Pas « Enregistrer » : la page des réglages a déjà ce bouton pour le Profil.
      bouton: "Appliquer à l'hydratation",
      enCours: "Mise à jour…",
      enregistre: "Hydratation mise à jour.",
    },
    erreurs: {
      objectifMl: "Indiquez un nombre entier de ml entre 250 et 10 000.",
      verreMl: "Indiquez un nombre entier de ml entre 10 et 2 000.",
    } satisfies Record<ChampHydratation, string>,
  },
  statistiques: {
    titre: "Statistiques",
    periodes: "Période",
    periode: (jours: number) => `${jours} jours`,
    intervalle: (du: string, au: string) => `Du ${du} au ${au}`,
    kcalTitre: "Kcal par jour",
    kcalIntro: "Un jour sans Entrée reste vide : il ne compte pas comme un jour à 0 kcal.",
    consomme: "Consommé",
    objectif: "Objectif calorique",
    sansEntree: "sans Entrée",
    sansObjectif: "pas d'objectif",
    resumeKcal: (avec: number, total: number) => `Kcal consommées sur ${avec} jours avec Entrée, sur ${total} jours.`,
    infobulleJour: (jour: string, kcal: string, objectif: string) => `${jour} : ${kcal} (objectif ${objectif})`,
    macrosTitre: "Moyenne des Macros",
    macrosIntro: (jours: number) =>
      jours === 0
        ? "Aucun jour avec Entrée sur la période."
        : `Moyenne sur ${jours} jour${jours > 1 ? "s" : ""} avec Entrée, comparée à vos cibles d'aujourd'hui.`,
    moyenne: "Moyenne",
    cible: "Cible",
    kcal: "Kcal",
    glucides: "Glucides",
    proteines: "Protéines",
    lipides: "Lipides",
    poidsTitre: "Poids",
    pesee: "Pesée",
    poidsCible: "Poids cible",
    aucunePesee: "Aucune Pesée sur la période.",
    resumePoids: (n: number, premier: string, dernier: string) =>
      `${n} Pesée${n > 1 ? "s" : ""} sur la période, de ${premier} à ${dernier}.`,
    voirTableau: "Voir les valeurs",
    jour: "Jour",
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

export function formaterLitres(ml: number): string {
  return `${formaterNombre(ml / 1000, 2)} L`;
}

export function formaterKg(kg: number): string {
  return `${formaterNombre(kg, 1)} kg`;
}

export function formaterKcal(kcal: number): string {
  return `${formaterNombre(Math.round(kcal))} kcal`;
}

export function formaterGrammes(g: number): string {
  return `${formaterNombre(Math.round(g))} g`;
}

/** Une valeur de nutriment en g : deux décimales sous 1 g, une au-delà. Null : « — » (inconnu). */
export function formaterNutriment(g: number | null): string {
  if (g === null) return "—";
  return `${formaterNombre(g, Math.abs(g) < 1 ? 2 : 1)} g`;
}

export function formaterQuantite(valeur: number, unite: string): string {
  return `${formaterNombre(valeur, 1)} ${unite}`;
}

export function formaterJourCourt(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(a, m - 1, j)),
  );
}
