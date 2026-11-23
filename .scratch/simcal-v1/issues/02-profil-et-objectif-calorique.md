# 02: Profil et Objectif calorique

**What to build:** À ma première connexion, je suis guidé pour remplir mon Profil (date de naissance, sexe pour le calcul avec une explication, taille, poids, niveau d'activité, fuseau horaire) et choisir mon Objectif (perdre, maintenir ou prendre, avec Poids cible et Rythme pour perdre ou prendre). Simcal m'affiche ma Dépense de repos, ma Dépense totale, mon Objectif calorique et mes cibles de Macros en grammes. Je peux tout modifier ensuite dans les réglages, et l'objectif est conservé jour par jour, si bien que les jours passés gardent leur objectif. Ce ticket crée le noyau nutritionnel (seam 1), un module pur écrit en commençant par les tests. Voir la spec, section Modules, point 1.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Les tests du noyau, écrits avant le code, couvrent : l'âge à partir de la date de naissance (la veille et le jour d'un anniversaire), Mifflin-St Jeor pour un homme et pour une femme, les quatre facteurs d'activité (1,2 ; 1,375 ; 1,55 ; 1,725), le déficit et le surplus pour chaque Rythme (Rythme × 7 700 ÷ 7), « maintenir » sans Rythme
- [ ] Le plancher est égal au plus élevé de la Dépense de repos et de 1 200 kcal (femme) ou 1 500 kcal (homme). Le noyau signale quand il a été appliqué, et l'interface l'explique
- [ ] Les cibles de Macros en grammes utilisent 4, 4 et 9 kcal par gramme, et une Répartition qui ne totalise pas 100 % est refusée
- [ ] La Répartition par défaut est de 50 % de glucides, 20 % de protéines et 30 % de lipides, et elle est modifiable
- [ ] La première configuration est obligatoire tant que le Profil n'est pas complet
- [ ] Modifier le Profil, l'Objectif ou la Répartition enregistre un nouvel objectif valable à partir d'aujourd'hui. Un test de services vérifie que l'objectif d'un jour passé ne change pas
- [ ] Le Journal du jour affiche l'Objectif calorique et les cibles de Macros du jour
