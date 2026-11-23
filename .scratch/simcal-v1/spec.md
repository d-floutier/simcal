Status: ready-for-agent

# Simcal V1

## Problem Statement

Je veux surveiller ce que je mange pour atteindre un poids cible, mais je ne sais pas combien de kcal et de macros il me faut par jour. Noter mes repas à la main ou dans un tableur est trop pénible pour que je tienne dans la durée. Les applis du commerce sont fermées, poussent vers un abonnement et gardent mes données de santé chez elles. Je veux mon propre outil de suivi nutritionnel. Je dois pouvoir l'utiliser vite depuis mon téléphone, juste après un repas, et retrouver les mêmes données sur mon ordinateur.

## Solution

Simcal est une web app en français, conçue d'abord pour le mobile et installable (PWA). J'y entre mon **Profil** et mon **Objectif**, et Simcal calcule mon **Objectif calorique** et ma **Répartition des macros**. Chaque jour, je remplis mon **Journal** par **Repas**, en cherchant des **Aliments** :
- des **Aliments génériques**, issus de CIQUAL ;
- des **Produits**, issus d'Open Food Facts, que je peux aussi scanner par **Code-barres** ;
- mes **Aliments personnalisés**.

Les **Récents** me permettent de renoter en un tap ce que je mange souvent. Je note aussi mes **Pesées** et mon **Hydratation** au **Verre**. Des statistiques sur 7 et 30 jours me montrent si je suis mon objectif. Mes données sont synchronisées entre mes appareils. Je peux les exporter ou les supprimer quand je veux.

## User Stories

### Compte et accès

1. En tant qu'utilisateur invité, je veux créer un compte avec mon email et un mot de passe, afin d'accéder à Simcal depuis n'importe quel appareil.
2. En tant que propriétaire de Simcal, je veux que seuls les emails d'une liste autorisée puissent s'inscrire, afin que des inconnus ne puissent pas créer de compte.
3. En tant que personne non autorisée, je veux voir un message clair quand mon inscription est refusée, afin de comprendre que l'accès est sur invitation.
4. En tant qu'utilisateur, je veux me connecter et me déconnecter, afin de protéger mes données sur un appareil partagé.
5. En tant qu'utilisateur, je veux rester connecté sur mon téléphone, afin de ne pas ressaisir mon mot de passe à chaque repas.
6. En tant qu'utilisateur, je veux retrouver exactement les mêmes données sur mon téléphone et sur mon ordinateur, afin de passer d'un appareil à l'autre sans rien perdre.
7. En tant qu'utilisateur mobile, je veux installer Simcal sur mon écran d'accueil, afin de l'ouvrir comme une app native.
8. En tant qu'utilisateur hors ligne, je veux que l'app s'ouvre quand même et m'indique qu'une connexion est nécessaire pour noter, afin de ne pas croire que mes saisies ont été enregistrées.

### Profil et objectif

9. En tant que nouvel utilisateur, je veux être guidé pour remplir mon Profil à ma première connexion, afin que Simcal puisse calculer mon Objectif calorique.
10. En tant qu'utilisateur, je veux indiquer ma date de naissance plutôt que mon âge, afin que le calcul se mette à jour tout seul quand je vieillis.
11. En tant qu'utilisateur, je veux indiquer mon sexe pour le calcul (homme ou femme), avec une explication de la raison de cette question, afin de comprendre à quoi sert cette donnée.
12. En tant qu'utilisateur, je veux indiquer ma taille en cm et mon poids en kg, afin que le calcul parte de mes vraies mensurations.
13. En tant qu'utilisateur, je veux choisir mon niveau d'activité (sédentaire, léger, modéré ou intense) avec une description de chaque niveau, afin de choisir le bon sans hésiter.
14. En tant qu'utilisateur, je veux choisir mon Objectif (perdre, maintenir ou prendre du poids), afin que Simcal adapte mon Objectif calorique.
15. En tant qu'utilisateur qui veut perdre ou prendre du poids, je veux indiquer un Poids cible, afin de savoir où j'en suis par rapport à lui.
16. En tant qu'utilisateur qui veut perdre ou prendre du poids, je veux choisir un Rythme de 0,25, 0,5 ou 0,75 kg par semaine, afin de doser l'effort.
17. En tant qu'utilisateur, je veux voir ma Dépense de repos, ma Dépense totale et mon Objectif calorique, afin de comprendre d'où vient le chiffre.
18. En tant qu'utilisateur qui veut perdre du poids, je veux que mon Objectif calorique ne descende jamais sous un plancher de sécurité, afin de ne pas me fixer un objectif dangereux.
19. En tant qu'utilisateur, je veux être prévenu quand le plancher de sécurité a limité mon Objectif calorique, afin de comprendre pourquoi le Rythme choisi n'est pas atteignable.
20. En tant qu'utilisateur, je veux voir ma Répartition des macros par défaut (50 % de glucides, 20 % de protéines, 30 % de lipides) et ce qu'elle donne en grammes, afin de savoir combien de chaque macro viser.
21. En tant qu'utilisateur, je veux modifier ma Répartition des macros, en étant prévenu tant que le total ne fait pas 100 %, afin d'adapter mes cibles à mon alimentation.
22. En tant qu'utilisateur, je veux modifier mon Profil et mon Objectif à tout moment, afin de suivre les changements de ma vie.
23. En tant qu'utilisateur, je veux qu'un changement de Profil ou d'Objectif ne modifie pas l'Objectif calorique des jours passés, afin que mon historique reste juste.
24. En tant qu'utilisateur qui a atteint son Poids cible, je veux que Simcal me propose de passer en Objectif « maintenir », afin de ne pas continuer à perdre ou à prendre par inertie.
25. En tant qu'utilisateur qui a atteint son Poids cible, je veux pouvoir refuser cette proposition, afin de garder la main sur mon Objectif.

### Journal

26. En tant qu'utilisateur, je veux voir le Journal d'aujourd'hui dès l'ouverture de l'app, afin de noter tout de suite ce que je viens de manger.
27. En tant qu'utilisateur, je veux voir mon Journal organisé en quatre Repas (petit-déjeuner, déjeuner, dîner, collations), afin de m'y retrouver dans ma journée.
28. En tant qu'utilisateur, je veux voir les kcal consommées, l'Objectif calorique du jour et ce qu'il me reste, afin de savoir où j'en suis.
29. En tant qu'utilisateur, je veux voir mes Macros du jour par rapport à leurs cibles, afin d'équilibrer mes repas.
30. En tant qu'utilisateur, je veux voir le total en kcal de chaque Repas, afin de repérer les repas les plus lourds.
31. En tant qu'utilisateur, je veux ajouter une Entrée à un Repas en choisissant un Aliment et une quantité, afin de noter ce que j'ai mangé.
32. En tant qu'utilisateur, je veux saisir la quantité en grammes ou en millilitres, ou choisir une Portion de l'Aliment, afin de noter vite sans tout peser.
33. En tant qu'utilisateur, je veux voir les kcal et les Macros de l'Entrée se mettre à jour pendant que je change la quantité, afin de juger avant de valider.
34. En tant qu'utilisateur, je veux modifier la quantité ou le Repas d'une Entrée, afin de corriger une erreur de saisie.
35. En tant qu'utilisateur, je veux supprimer une Entrée, afin de retirer ce que je n'ai finalement pas mangé.
36. En tant qu'utilisateur, je veux naviguer vers les jours précédents et les modifier, afin de rattraper un oubli.
37. En tant qu'utilisateur, je veux ne pas pouvoir noter d'Entrée sur un jour futur, afin d'éviter les erreurs de date.
38. En tant qu'utilisateur, je veux que les jours suivent mon fuseau horaire local, afin qu'un dîner tardif compte pour le bon jour.
39. En tant qu'utilisateur, je veux que les valeurs d'une Entrée déjà notée ne changent pas si l'Aliment est corrigé ensuite, afin que mes jours passés restent stables (ADR-0001).
40. En tant qu'utilisateur, je veux voir les fibres, les sucres, les graisses saturées et le sel d'une Entrée quand ils sont connus, afin d'en savoir plus sans que ces valeurs soient obligatoires.

### Recherche d'aliments

41. En tant qu'utilisateur, je veux chercher un Aliment en tapant son nom en français, afin de le trouver sans connaître son nom exact.
42. En tant qu'utilisateur, je veux que la recherche tolère les accents et la casse (« creme » doit trouver « Crème »), afin de taper vite sur mobile.
43. En tant qu'utilisateur, je veux voir mes Récents avant même de taper, afin de renoter en un tap ce que je mange souvent.
44. En tant qu'utilisateur, je veux que les Récents gardent mes 20 derniers Aliments distincts avec la dernière quantité utilisée, préremplie, afin de valider sans rien retaper.
45. En tant qu'utilisateur, je veux voir les résultats dans l'ordre Récents, Aliments personnalisés, Aliments génériques, puis Produits, afin de trouver d'abord ce qui m'est familier.
46. En tant qu'utilisateur, je veux voir pour chaque résultat son nom, sa marque s'il s'agit d'un Produit, et ses kcal pour 100 g ou 100 ml, afin de choisir le bon.
47. En tant qu'utilisateur, je veux trouver des Aliments génériques comme « pomme » ou « riz blanc cuit » avec des valeurs fiables, afin de noter les aliments non emballés.
48. En tant qu'utilisateur, je veux trouver des Produits de marque vendus en France, afin de noter les aliments emballés.
49. En tant qu'utilisateur, je veux que la recherche de Produits reste utilisable même quand Open Food Facts est lent ou indisponible, et que les autres résultats s'affichent quand même, afin de ne jamais rester bloqué.
50. En tant qu'utilisateur, je veux voir la fiche d'un Aliment (valeurs pour 100 g et Portions disponibles) avant de le noter, afin de vérifier ses valeurs.
51. En tant qu'utilisateur, je veux qu'un Produit fourni seulement en kJ s'affiche en kcal, afin d'avoir une seule unité partout.

### Aliments personnalisés

52. En tant qu'utilisateur, je veux créer un Aliment personnalisé avec un nom, les kcal et les trois Macros pour 100 g ou 100 ml, afin de noter ce que je ne trouve nulle part.
53. En tant qu'utilisateur, je veux pouvoir ajouter les fibres, les sucres, les graisses saturées et le sel à un Aliment personnalisé, afin de compléter ses valeurs si je les connais.
54. En tant qu'utilisateur, je veux définir des Portions pour un Aliment personnalisé (par exemple « 1 bol = 300 g »), afin de le noter vite ensuite.
55. En tant qu'utilisateur, je veux modifier un Aliment personnalisé sans changer les Entrées déjà notées, afin de corriger ses valeurs pour la suite.
56. En tant qu'utilisateur, je veux supprimer un Aliment personnalisé sans perdre les Entrées déjà notées avec lui, afin de faire le ménage sans abîmer mon historique.
57. En tant qu'utilisateur, je veux voir la liste de mes Aliments personnalisés, afin de les gérer.

### Scan de code-barres

58. En tant qu'utilisateur mobile, je veux scanner le Code-barres d'un produit avec la caméra, afin de le noter sans taper.
59. En tant qu'utilisateur d'iPhone, je veux que le scan fonctionne aussi dans Safari, afin de ne pas être exclu.
60. En tant qu'utilisateur, je veux qu'un Code-barres reconnu ouvre directement la saisie de quantité pour ce Produit, afin de noter en deux gestes.
61. En tant qu'utilisateur, je veux qu'un Code-barres associé à un de mes Aliments personnalisés soit retrouvé en priorité, afin que mes propres saisies passent avant Open Food Facts.
62. En tant qu'utilisateur, je veux, quand un Code-barres est introuvable, qu'on me propose de créer un Aliment personnalisé lié à ce code, afin que le prochain scan le retrouve.
63. En tant qu'utilisateur, je veux pouvoir taper le Code-barres à la main si la caméra n'y arrive pas ou si j'ai refusé l'accès à la caméra, afin d'avoir une solution de repli.

### Pesées

64. En tant qu'utilisateur, je veux noter une Pesée en kg pour aujourd'hui ou un jour passé, afin de suivre mon poids.
65. En tant qu'utilisateur, je veux qu'une nouvelle Pesée sur un jour qui en a déjà une remplace la précédente, afin de n'avoir qu'une Pesée par jour.
66. En tant qu'utilisateur, je veux que ma Pesée la plus récente devienne le poids de mon Profil, afin de ne pas avoir à le mettre à jour deux fois.
67. En tant qu'utilisateur, je veux que mon Objectif calorique soit recalculé à partir du jour de la Pesée la plus récente, sans toucher aux jours précédents, afin que l'objectif suive mon poids.
68. En tant qu'utilisateur, je veux modifier ou supprimer une Pesée, afin de corriger une erreur.
69. En tant qu'utilisateur, je veux voir combien il me reste à perdre ou à prendre pour atteindre mon Poids cible, afin de rester motivé.

### Hydratation

70. En tant qu'utilisateur, je veux ajouter un Verre d'eau en un tap depuis le Journal du jour, afin de suivre mon Hydratation sans effort.
71. En tant qu'utilisateur, je veux voir mon Hydratation du jour par rapport à mon Objectif d'hydratation, afin de savoir s'il faut boire plus.
72. En tant qu'utilisateur, je veux retirer un Verre ajouté par erreur, afin de garder un total juste.
73. En tant qu'utilisateur, je veux modifier mon Objectif d'hydratation (2 L par défaut) et la taille de mon Verre (250 ml par défaut), afin de les adapter à mes habitudes.
74. En tant qu'utilisateur, je veux que les boissons notées dans le Journal ne comptent pas dans l'Hydratation, afin que l'Hydratation ne mesure que l'eau.
75. En tant qu'utilisateur, je veux noter mon Hydratation aussi pour un jour passé, afin de rattraper un oubli.

### Statistiques

76. En tant qu'utilisateur, je veux voir mes kcal consommées par jour sur 7 et 30 jours, chacune comparée à l'Objectif calorique de ce jour-là, afin de juger ma régularité.
77. En tant qu'utilisateur, je veux voir ma moyenne de Macros sur la période, comparée à mes cibles, afin de repérer un déséquilibre durable.
78. En tant qu'utilisateur, je veux voir la courbe de mes Pesées sur la période, avec mon Poids cible, afin de voir ma tendance.
79. En tant qu'utilisateur, je veux que les jours sans Entrée ne comptent pas comme des jours à 0 kcal dans les moyennes, afin que mes oublis ne faussent pas les statistiques.
80. En tant qu'utilisateur, je veux que les jours sans Entrée apparaissent comme vides sur le graphique, afin de distinguer un oubli d'un jeûne.

### Données personnelles

81. En tant qu'utilisateur, je veux exporter toutes mes données (Profil, Objectifs, Journal, Pesées, Hydratation, Aliments personnalisés) dans un fichier JSON, afin d'en garder une copie ou de les emmener ailleurs.
82. En tant qu'utilisateur, je veux supprimer mon compte et toutes mes données de façon définitive, après une confirmation explicite, afin d'exercer mon droit à l'effacement.
83. En tant qu'utilisateur, je veux que personne d'autre ne puisse lire mes données, même s'il connaît des identifiants, afin que mes données de santé restent privées.

## Implementation Decisions

### Stack

- Next.js (App Router) en TypeScript, en un seul projet. L'interface est en React avec Tailwind et shadcn/ui, et une identité Simcal minimale (couleur, typo, logo texte). Simcal ne reprend ni la marque, ni les écrans, ni les textes de Yazio.
- Les données sont dans Postgres sur Neon, accédées avec Drizzle, et le schéma est versionné par des migrations.
- L'app est hébergée sur Vercel.
- L'authentification passe par Better Auth, avec email et mot de passe. L'inscription est fermée : une liste d'emails autorisés est fournie par la configuration.
- C'est une PWA : un manifeste et un service worker qui ne met en cache que l'interface. Noter quoi que ce soit demande une connexion.
- Les textes de l'interface sont en français. Ils sont regroupés à un seul endroit pour qu'on puisse traduire plus tard, mais aucune traduction n'est faite en V1.

### Modules

**1. Noyau nutritionnel** (module pur, sans base de données ni framework) : c'est le seam de test principal. Son interface :
- âge à partir de la date de naissance et d'un jour donné ;
- Dépense de repos avec Mifflin-St Jeor, selon le sexe pour le calcul, le poids, la taille et l'âge ;
- Dépense totale, égale à la Dépense de repos multipliée par le facteur d'activité (sédentaire 1,2 ; léger 1,375 ; modéré 1,55 ; intense 1,725) ;
- Objectif calorique : la Dépense totale, moins (pour perdre) ou plus (pour prendre) Rythme × 7 700 ÷ 7. Le résultat est borné par un plancher égal au plus élevé de la Dépense de repos et de 1 200 kcal (femme) ou 1 500 kcal (homme). Le calcul indique aussi si le plancher a été appliqué ;
- cibles de Macros en grammes, à partir de l'Objectif calorique et de la Répartition des macros (4 kcal par gramme de glucides ou de protéines, 9 kcal par gramme de lipides). La Répartition doit totaliser 100 % ;
- conversion d'une quantité (en g, en ml ou en Portion) en grammes, avec 1 ml = 1 g ;
- valeurs nutritionnelles d'une Entrée, à partir des valeurs pour 100 g et de la quantité ;
- totaux d'un jour, au total et par Repas ;
- conversion kJ → kcal (÷ 4,184) ;
- détection du Poids cible atteint, selon le sens de l'Objectif ;
- les arrondis sont faits uniquement à l'affichage. Les calculs gardent toute leur précision.

**2. Sources d'aliments** : une interface commune « source d'aliments », avec deux opérations : chercher par texte et trouver par Code-barres.
- **CIQUAL** : il est importé dans notre base par un script répétable, et cherché en plein texte en français, sans tenir compte des accents ni de la casse.
- **Open Food Facts** : c'est un client HTTP qui ne garde que les produits vendus en France. Il ramène les valeurs à la forme « pour 100 g », avec conversion depuis les kJ si besoin. Il a un délai d'attente court et une erreur ne casse jamais la recherche. Il s'identifie auprès d'Open Food Facts avec un User-Agent générique propre à Simcal.
- **Aliments personnalisés** : ils viennent de la base et appartiennent à l'utilisateur.
- Tout Produit noté ou scanné est gardé en base, ce qui allège les appels à Open Food Facts.
- Dans les tests, la source Open Food Facts est remplacée par une fausse source.

**3. Services de l'application** : c'est le seam de test des règles métier. Next.js les appelle (Server Actions ou routes), toujours pour l'utilisateur connecté. Les opérations :
- profil et objectif : lire, enregistrer ;
- Journal : lire un jour (Entrées, totaux, objectif du jour, hydratation), ajouter une Entrée, modifier une Entrée, supprimer une Entrée ;
- recherche : chercher des Aliments, trouver par Code-barres, lire les Récents ;
- Aliments personnalisés : créer, modifier, supprimer, lister ;
- Pesées : enregistrer, modifier, supprimer, lister ;
- Hydratation : ajouter un Verre, retirer un Verre, modifier l'Objectif d'hydratation et la taille du Verre ;
- statistiques sur 7 ou 30 jours ;
- export de toutes les données en JSON ;
- suppression du compte.

**4. Interface** : des écrans conçus d'abord pour le mobile :
- la première configuration du Profil ;
- le Journal du jour, avec navigation par date ;
- l'ajout d'une Entrée : recherche, Récents, scan, quantité ;
- la fiche d'un Aliment ;
- la gestion des Aliments personnalisés ;
- les Pesées ;
- les statistiques ;
- les réglages : Profil, Objectif, Macros, Hydratation, export, suppression du compte.

**5. Scan** : un composant caméra qui utilise l'API BarcodeDetector quand elle existe, et zxing sinon (pour Safari sur iOS). La saisie manuelle du code est possible en repli. Le scan ne fait que lire le code, puis passe la main à « trouver par Code-barres ».

### Règles métier (appliquées par les services)

- **Copie des valeurs (ADR-0001)** : une Entrée garde une copie de ses valeurs nutritionnelles pour 100 g, ainsi que son nom et sa marque au moment de la saisie. Elle garde aussi un lien vers l'Aliment d'origine, qui peut devenir orphelin. Les totaux sont toujours calculés à partir de la copie.
- **Objectif calorique jour par jour** : chaque modification du Profil, de l'Objectif, de la Répartition des macros ou de la Pesée la plus récente enregistre un nouvel objectif valable à partir d'un jour donné. L'objectif d'un jour est le dernier enregistré à cette date ou avant. Les jours passés gardent leur objectif. Il en va de même pour l'Objectif d'hydratation.
- **Pesée** : au plus une par jour et par utilisateur (contrainte d'unicité). Une nouvelle saisie remplace la Pesée existante du même jour. Le poids du Profil est celui de la Pesée la plus récente.
- **Jours futurs** : ajouter une Entrée, une Pesée ou un Verre sur un jour postérieur à aujourd'hui (dans le fuseau de l'utilisateur) est refusé. Le jour est une date de calendrier locale, et le fuseau de l'utilisateur fait partie de son Profil.
- **Récents** : ce sont les 20 derniers Aliments distincts notés, triés par date de dernière Entrée, chacun avec sa dernière quantité (en grammes ou en Portion).
- **Ordre de recherche** : Récents qui correspondent à la recherche, puis Aliments personnalisés, Aliments génériques (CIQUAL) et Produits (Open Food Facts), sans doublons.
- **Code-barres** : un Aliment personnalisé lié au code a priorité, puis un Produit déjà gardé en base, puis Open Food Facts. Si rien n'est trouvé, le service le signale pour que l'interface propose de créer un Aliment personnalisé lié à ce code.
- **Hydratation** : elle est stockée comme une suite d'ajouts en ml pour un jour donné. Retirer un Verre annule le dernier ajout. Les Entrées du Journal n'y comptent jamais.
- **Isolation** : chaque lecture et chaque écriture est filtrée par l'utilisateur connecté. Les Aliments génériques et les Produits gardés en base sont partagés et en lecture seule. Les Aliments personnalisés sont privés.
- **Suppression du compte** : elle efface en cascade toutes les données personnelles. Les Produits gardés en base, partagés, ne sont pas effacés.

### Schéma (entités)

- un utilisateur et ses sessions, gérés par Better Auth ;
- le Profil, un par utilisateur ;
- l'historique de l'Objectif et des cibles : une ligne par changement, avec son jour de début ;
- les Aliments : générique, Produit ou personnalisé, avec leurs valeurs pour 100 g, leur Code-barres éventuel et leur propriétaire pour les personnalisés ;
- les Portions d'un Aliment ;
- les Entrées : utilisateur, jour, Repas, quantité, et copie des valeurs ;
- les Pesées : utilisateur, jour, poids, unique par jour ;
- les ajouts d'eau : utilisateur, jour, ml.

## Testing Decisions

- Un bon test vérifie un comportement observable depuis l'interface publique d'un seam : ce qui entre, ce qui sort et ce qui est enregistré. Il ne dépend jamais de la structure interne. Il doit rester vrai si on réorganise le code sans changer le comportement.
- **Seam 1, le noyau nutritionnel** : des tests Vitest écrits avant le code. Ils couvrent les calculs de référence de Mifflin-St Jeor pour un homme et une femme, chaque facteur d'activité, le déficit et le surplus selon chaque Rythme, l'application du plancher (et le signalement qu'il a été appliqué), « maintenir » sans Rythme, la conversion des Macros en grammes, le refus d'une Répartition qui ne fait pas 100 %, les Portions et la règle 1 ml = 1 g, la conversion kJ → kcal, les totaux d'un jour par Repas, l'âge calculé la veille et le jour même d'un anniversaire, et la détection du Poids cible atteint dans les deux sens.
- **Seam 2, les services de l'application** : des tests Vitest contre PGlite (Postgres en mémoire), avec les mêmes migrations Drizzle qu'en production. La source Open Food Facts est remplacée par une fausse source, et c'est le seul élément simulé. Ces tests vérifient :
  - qu'une Entrée garde ses valeurs après la modification ou la suppression de son Aliment ;
  - qu'une Pesée sur un jour déjà pesé remplace la précédente ;
  - que la Pesée la plus récente met à jour le Profil et l'objectif à partir de son jour, sans changer les jours passés ;
  - que les jours futurs sont refusés ;
  - que les Récents sont limités à 20, sans doublons, et gardent la dernière quantité ;
  - l'ordre des résultats de recherche et l'absence de doublons ;
  - que la recherche marche quand Open Food Facts est en panne ;
  - la priorité des codes-barres et le cas d'un code introuvable ;
  - le calcul de l'Hydratation et le retrait d'un Verre ;
  - que les statistiques ignorent les jours vides ;
  - que l'export est complet ;
  - que la suppression du compte est complète, sans toucher aux Produits partagés ;
  - que les données d'un utilisateur sont isolées de celles d'un autre.
- **Seam 3, les parcours Playwright** : peu nombreux. Ils couvrent la connexion, la première configuration du Profil, l'ajout d'une Entrée par recherche, une Pesée et un scan simulé par saisie manuelle du code. Ils vérifient que tout est branché, pas les règles métier.
- L'interface React n'a pas de tests unitaires.
- Aucun test n'existe encore, puisque le repo est vide. Les premiers tests du noyau nutritionnel serviront de modèle pour les suivants.

## Out of Scope

- Les recettes et les repas enregistrés.
- Le jeûne intermittent.
- Les activités, les pas et les calories brûlées ajoutées à l'objectif.
- Le mode hors ligne avec file de synchronisation.
- L'inscription ouverte, les abonnements et les paiements.
- L'envoi de produits ou de corrections à Open Food Facts.
- Les favoris, distincts des Récents.
- Des Repas personnalisables (en ajouter ou les renommer).
- Noter sur des jours futurs (planification).
- D'autres langues que le français, d'autres unités (lb, oz, kJ à l'affichage) et les densités réelles des liquides.
- Les objectifs pour les fibres, les sucres, les graisses saturées et le sel.
- Les notifications et les rappels.
- La connexion à des appareils ou services santé (Apple Santé, Google Fit, balances connectées).

## Further Notes

- Le vocabulaire suit `GLOSSARY.md`, et la copie des valeurs suit `docs/adr/0001-entrees-copient-les-valeurs-nutritionnelles.md`.
- CIQUAL est publié par l'ANSES sous Licence Ouverte. Open Food Facts est sous licence ODbL : les deux sources doivent être créditées dans l'app.
- Ce sont des données de santé. Même pour un seul utilisateur, on ne stocke que le nécessaire, on n'envoie aucune donnée personnelle à Open Food Facts (la recherche envoie seulement le texte tapé ou le code), et l'export comme la suppression doivent marcher dès la V1.
- Simcal est d'abord un outil personnel, mais l'isolation entre utilisateurs est appliquée dès le départ pour qu'on puisse ouvrir l'inscription sans tout reprendre.
