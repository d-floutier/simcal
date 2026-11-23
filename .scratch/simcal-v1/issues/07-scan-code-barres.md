# 07: Scan de code-barres

**What to build:** Sur mon téléphone, je scanne le Code-barres d'un produit avec la caméra, dans Safari sur iPhone comme sur Android. Un code reconnu ouvre directement la saisie de quantité. Un code lié à un de mes Aliments personnalisés est trouvé en priorité. Si le code est introuvable, on me propose de créer un Aliment personnalisé lié à ce code, que le prochain scan retrouvera. Si la caméra est indisponible ou refusée, je peux taper le code à la main.

**Blocked by:** 04, 05

**Status:** ready-for-agent

- [ ] La lecture par la caméra utilise BarcodeDetector quand il existe, et zxing sinon. Elle marche dans Safari sur iOS
- [ ] La saisie manuelle du code est toujours possible
- [ ] Le code est cherché dans cet ordre : Aliment personnalisé lié au code, Produit gardé en base, puis Open Food Facts (test de services)
- [ ] Un code reconnu ouvre la saisie de quantité pour cet Aliment
- [ ] Un code introuvable propose de créer un Aliment personnalisé lié au code, puis un scan suivant du même code le retrouve (test de services)
- [ ] Aucune donnée n'est envoyée à Open Food Facts en dehors du code lui-même
- [ ] Un parcours Playwright simule un scan par saisie manuelle du code
