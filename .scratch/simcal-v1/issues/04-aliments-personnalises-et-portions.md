# 04: Aliments personnalisés et Portions

**What to build:** Je crée un Aliment personnalisé avec un nom, les kcal et les trois Macros pour 100 g ou 100 ml, et éventuellement les fibres, les sucres, les graisses saturées et le sel. Je lui définis des Portions (par exemple « 1 bol = 300 g »). Mes Aliments personnalisés apparaissent dans la recherche avant les Aliments génériques. Au moment d'ajouter une Entrée, je peux choisir une Portion au lieu de taper des grammes. Modifier ou supprimer un Aliment personnalisé ne change pas les Entrées déjà notées.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Je peux créer, modifier, supprimer et lister mes Aliments personnalisés
- [ ] Les kcal et les trois Macros sont obligatoires, et les autres nutriments facultatifs
- [ ] Je peux définir, modifier et supprimer les Portions d'un Aliment personnalisé
- [ ] La saisie d'une Entrée propose les Portions de l'Aliment, et la conversion en grammes vient du noyau (test du noyau)
- [ ] Dans la recherche, les Aliments personnalisés passent avant les Aliments génériques
- [ ] Après la modification ou la suppression d'un Aliment personnalisé, les Entrées existantes gardent leurs valeurs, et une Entrée liée à un Aliment supprimé reste affichée (test de services)
- [ ] Les Aliments personnalisés d'un utilisateur sont invisibles pour les autres
