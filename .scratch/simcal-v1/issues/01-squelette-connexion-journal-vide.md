# 01: Squelette : connexion et Journal vide

**What to build:** Je peux ouvrir Simcal déployé en ligne, créer un compte avec un email de la liste autorisée, me connecter, et arriver sur un Journal du jour vide. Un email non autorisé est refusé avec un message clair. Ce ticket pose aussi tout le socle : Next.js (App Router, TypeScript), Tailwind et shadcn/ui, Postgres sur Neon avec Drizzle et ses migrations, Better Auth, et le harnais des trois seams de test (Vitest pour le noyau, Vitest contre PGlite avec les migrations de production pour les services, Playwright pour les parcours). Voir la spec, sections Stack et Testing Decisions.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Le projet Next.js en TypeScript démarre en local et se déploie sur Vercel
- [ ] La base Neon est créée et le schéma est géré par des migrations Drizzle
- [ ] Un email de la liste autorisée (fournie par la configuration) peut créer un compte avec un mot de passe
- [ ] Un email absent de la liste est refusé avec un message qui explique que l'accès est sur invitation
- [ ] Je peux me connecter et me déconnecter, et ma session persiste sur mobile
- [ ] Une fois connecté, j'arrive sur une page Journal du jour vide, avec les quatre Repas
- [ ] Les pages de l'app sont inaccessibles sans connexion
- [ ] Les textes de l'interface sont en français et regroupés à un seul endroit
- [ ] Le harnais de test des services tourne contre PGlite avec les migrations de production, avec un test d'exemple vert
- [ ] Un parcours Playwright couvre l'inscription autorisée, l'inscription refusée et la connexion
