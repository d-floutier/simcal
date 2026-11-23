# 11: Export et suppression du compte

**What to build:** Dans les réglages, j'exporte toutes mes données (Profil, historique des Objectifs, Journal, Pesées, Hydratation, Aliments personnalisés et leurs Portions) dans un fichier JSON. Je peux aussi supprimer mon compte définitivement, après une confirmation explicite. Toutes mes données personnelles sont alors effacées, sans toucher aux Produits partagés gardés en base. Ce ticket vérifie aussi que les données de deux utilisateurs restent séparées.

**Blocked by:** 04, 05, 08, 09

**Status:** ready-for-agent

- [ ] L'export JSON contient tous les types de données personnelles (test de services : chaque type est présent)
- [ ] La suppression du compte demande une confirmation explicite
- [ ] La suppression efface toutes les données personnelles. Les Aliments génériques et les Produits gardés en base restent (test de services)
- [ ] Après la suppression, la session est fermée et l'email peut se réinscrire s'il est toujours dans la liste autorisée
- [ ] Un test de services avec deux utilisateurs vérifie qu'aucune lecture ni écriture ne déborde sur les données de l'autre
