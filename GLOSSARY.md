# Simcal

Simcal est une web app de suivi nutritionnel : l'utilisateur fixe un objectif de poids, note ce qu'il mange et boit, et suit son poids dans le temps.

## Language

### Objectif

**Profil** :
Les caractéristiques physiques de l'utilisateur (sexe pour le calcul, date de naissance, taille, poids, niveau d'activité) qui servent à estimer ses dépenses, ainsi que son fuseau horaire, qui fixe le changement de jour.
_Avoid_ : compte, fiche

**Objectif** :
L'intention de poids de l'utilisateur : perdre, maintenir ou prendre du poids. Pour perdre ou prendre, elle comprend aussi un poids cible et un rythme.
_Avoid_ : but, programme, plan

**Poids cible** :
Le poids que l'utilisateur veut atteindre.
_Avoid_ : poids idéal, poids objectif

**Rythme** :
La variation de poids visée par semaine (0,25, 0,5 ou 0,75 kg).
_Avoid_ : vitesse, cadence

**Dépense de repos** :
L'énergie que le corps dépense par jour au repos complet.
_Avoid_ : métabolisme de base, BMR, MB

**Dépense totale** :
L'énergie dépensée par jour en tenant compte du niveau d'activité.
_Avoid_ : TDEE, maintenance, besoins

**Objectif calorique** :
Les kcal à consommer par jour pour suivre l'objectif, c'est-à-dire la dépense totale corrigée du déficit ou du surplus lié au rythme. Il ne descend jamais sous un plancher de sécurité. Chaque jour a son propre objectif calorique, celui qui était en vigueur ce jour-là.
_Avoid_ : budget, quota, limite

**Répartition des macros** :
La part des kcal de l'objectif calorique attribuée aux glucides, aux protéines et aux lipides.
_Avoid_ : ratio, split

### Aliments

**Aliment** :
Tout ce qui peut être noté dans le journal, avec ses valeurs nutritionnelles. C'est le terme qui englobe les aliments génériques, les produits et les aliments personnalisés.
_Avoid_ : nourriture, item

**Aliment générique** :
Un aliment sans marque, issu d'une table nutritionnelle de référence (par exemple « pomme » ou « riz blanc cuit »).
_Avoid_ : aliment de base, ingrédient

**Produit** :
Un aliment de marque, vendu dans le commerce et identifié par un code-barres.
_Avoid_ : article, référence

**Aliment personnalisé** :
Un aliment créé par l'utilisateur lui-même, quand il ne le trouve pas ailleurs.
_Avoid_ : aliment custom, aliment maison

**Portion** :
Une quantité nommée d'un aliment, équivalente à un poids ou à un volume (par exemple « 1 pot = 125 g »).
_Avoid_ : part, dose, serving

**Code-barres** :
Le code EAN qui identifie un produit, ou un aliment personnalisé que l'utilisateur y a associé.
_Avoid_ : EAN, GTIN

**Macros** :
Les trois macronutriments suivis : glucides, protéines et lipides.
_Avoid_ : nutriments (ce terme est trop large)

### Journal

**Journal** :
Le relevé, jour par jour, de ce que l'utilisateur a mangé et bu.
_Avoid_ : diary, carnet, historique

**Repas** :
L'un des quatre moments fixes qui organisent le journal : petit-déjeuner, déjeuner, dîner ou collations.
_Avoid_ : créneau, slot

**Entrée** :
Une ligne du journal : un aliment, une quantité et un repas pour un jour donné. Elle conserve les valeurs nutritionnelles telles qu'elles étaient au moment de la saisie.
_Avoid_ : log, ligne, consommation

**Récents** :
Les 20 derniers aliments distincts notés par l'utilisateur, chacun avec sa dernière quantité, proposés en premier pour une nouvelle entrée.
_Avoid_ : historique, favoris (les favoris seraient un choix explicite de l'utilisateur)

### Suivi

**Pesée** :
Le poids noté par l'utilisateur pour un jour donné, avec au plus une pesée par jour. La plus récente devient le poids du profil.
_Avoid_ : mesure, relevé de poids

**Hydratation** :
La quantité d'eau bue sur une journée, comparée à l'objectif d'hydratation. Seuls les verres d'eau comptent : les boissons notées dans le journal n'y entrent pas.
_Avoid_ : eau, boisson

**Objectif d'hydratation** :
La quantité d'eau à boire par jour (2 L par défaut).
_Avoid_ : objectif d'eau

**Verre** :
L'unité d'ajout rapide pour l'hydratation (250 ml par défaut).
_Avoid_ : gobelet, dose
