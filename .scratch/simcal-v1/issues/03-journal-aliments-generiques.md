# 03: Journal avec les Aliments génériques

**What to build:** Je cherche un Aliment générique issu de CIQUAL (par exemple « creme » trouve « Crème », sans tenir compte des accents ni de la casse), j'ouvre sa fiche, puis je l'ajoute à un Repas en grammes ou en millilitres. Les kcal et les Macros se mettent à jour pendant que je saisis. Le Journal affiche les totaux du jour et de chaque Repas, comparés à l'objectif du jour, et ce qu'il me reste. Je peux modifier ou supprimer une Entrée, aller sur les jours passés, mais pas noter sur un jour futur. Chaque Entrée garde une copie de ses valeurs (ADR-0001).

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Un script répétable importe CIQUAL dans la base
- [ ] La recherche en français ignore les accents et la casse
- [ ] La fiche d'un Aliment montre ses valeurs pour 100 g, et les nutriments facultatifs quand ils sont connus
- [ ] Je peux ajouter une Entrée à un des quatre Repas avec une quantité en g ou en ml (1 ml = 1 g)
- [ ] Je peux modifier la quantité ou le Repas d'une Entrée, et la supprimer
- [ ] Les totaux du jour et de chaque Repas, ainsi que le reste par rapport à l'objectif du jour, viennent du noyau (tests du noyau sur les valeurs d'une Entrée et les totaux par Repas)
- [ ] Une Entrée garde une copie de ses valeurs pour 100 g, de son nom et de sa marque au moment de la saisie, et les totaux sont calculés à partir de cette copie (test de services)
- [ ] Je peux aller sur les jours passés et les modifier. Une Entrée sur un jour futur, dans le fuseau de l'utilisateur, est refusée (test de services)
- [ ] Un parcours Playwright couvre l'ajout d'une Entrée par la recherche
