# 05: Produits Open Food Facts dans la recherche

**What to build:** Quand je cherche, les Produits de marque vendus en France apparaissent après mes Aliments personnalisés et les Aliments génériques, avec leur marque, leurs kcal pour 100 g et leurs Portions quand Open Food Facts en fournit. Si Open Food Facts est lent ou en panne, les autres résultats s'affichent quand même. Les Produits que je note sont gardés en base. Ce ticket crée l'interface « source d'aliments » (chercher par texte, trouver par Code-barres) et le client Open Food Facts. Voir la spec, section Modules, point 2.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] Une interface « source d'aliments » commune est en place, avec une fausse source Open Food Facts pour les tests
- [ ] Le client Open Food Facts ne garde que les produits vendus en France et ramène les valeurs à la forme « pour 100 g »
- [ ] Un Produit fourni seulement en kJ est converti en kcal (÷ 4,184, test du noyau)
- [ ] Les portions fournies par Open Food Facts deviennent des Portions du Produit
- [ ] Le client a un délai d'attente court. Si Open Food Facts échoue, la recherche renvoie quand même les autres résultats (test de services)
- [ ] Le client s'identifie avec un User-Agent générique propre à Simcal, et n'envoie que le texte cherché
- [ ] Un Produit noté est gardé en base et réutilisé ensuite
- [ ] L'ordre est Aliments personnalisés, Aliments génériques puis Produits, sans doublons (test de services)
- [ ] Les crédits CIQUAL (Licence Ouverte) et Open Food Facts (ODbL) sont visibles dans l'app
