# 08: Pesées

**What to build:** Je note une Pesée en kg pour aujourd'hui ou un jour passé. Une nouvelle Pesée sur un jour qui en a déjà une la remplace. La Pesée la plus récente devient le poids de mon Profil, et mon Objectif calorique est recalculé à partir de son jour, sans toucher aux jours précédents. Je vois combien il me reste jusqu'à mon Poids cible. Quand je l'atteins, Simcal me propose de passer en « maintenir », et je peux refuser.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Je peux noter, modifier et supprimer une Pesée
- [ ] Il y a au plus une Pesée par jour et par utilisateur, grâce à une contrainte d'unicité, et une nouvelle saisie remplace la précédente (test de services)
- [ ] Une Pesée sur un jour futur est refusée
- [ ] La Pesée la plus récente met à jour le poids du Profil et enregistre un nouvel objectif à partir de son jour. Les jours passés gardent leur objectif (test de services)
- [ ] Supprimer la Pesée la plus récente rend son rôle à la précédente
- [ ] L'écart restant jusqu'au Poids cible est affiché
- [ ] Le noyau détecte que le Poids cible est atteint, dans les deux sens (test du noyau). Simcal propose alors de passer en « maintenir », je peux refuser, et la proposition ne revient pas à chaque ouverture
- [ ] Un parcours Playwright couvre l'ajout d'une Pesée
