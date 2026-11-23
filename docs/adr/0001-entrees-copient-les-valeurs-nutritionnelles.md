# Les entrées copient les valeurs nutritionnelles

Chaque entrée du journal garde sa propre copie des valeurs nutritionnelles de l'aliment (kcal, macros et nutriments facultatifs) au moment de la saisie. Elle ne lit pas les valeurs actuelles de l'aliment. Les données d'Open Food Facts sont corrigées en continu, et un aliment personnalisé peut être modifié ou supprimé. Sans cette copie, les totaux et les statistiques des jours passés changeraient sans que l'utilisateur ait rien fait.

## Consequences

- Une entrée garde quand même un lien vers son aliment d'origine, ce qui sert aux Récents et à la navigation. Ce lien peut devenir orphelin, par exemple si l'aliment personnalisé est supprimé.
- Corriger un aliment ne corrige pas les jours déjà notés : c'est voulu. Si on veut un jour proposer de « réappliquer » les nouvelles valeurs, ce sera une action explicite de l'utilisateur.
