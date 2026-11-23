# Simcal

Web app de suivi nutritionnel, en français, conçue d'abord pour le mobile. Vocabulaire : `GLOSSARY.md`. Décisions : `docs/adr/`.

Stack : Next.js 16 (App Router, TypeScript), Tailwind 4 + shadcn/ui (Base UI), Postgres (Neon en production, PGlite en local) avec Drizzle, Better Auth (email + mot de passe, inscription fermée).

## Démarrer en local

```sh
pnpm install
cp .env.example .env.local   # puis renseigner BETTER_AUTH_SECRET et SIMCAL_ALLOWED_EMAILS
pnpm dev                     # applique les migrations, importe CIQUAL puis lance http://localhost:3000
```

Sans `DATABASE_URL`, la base est un dossier PGlite local (`./.pglite`, ignoré par git). PGlite n'accepte qu'un processus à la fois : arrêtez `pnpm dev` avant de lancer `pnpm db:migrate` à part.

## Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | en production | Chaîne de connexion Neon (pooled). Vide en local : PGlite est utilisé. |
| `PGLITE_DIR` | non | Dossier PGlite local (défaut `./.pglite`). Ignoré si `DATABASE_URL` est défini. |
| `BETTER_AUTH_SECRET` | oui | Secret de signature des sessions, 32 caractères minimum (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | oui en production | URL publique de l'app (`https://…`). |
| `SIMCAL_ALLOWED_EMAILS` | oui | Emails autorisés à créer un compte, séparés par des virgules. Liste vide : personne ne peut s'inscrire. |

## Base de données et migrations

- Le schéma est dans `src/db/schema.ts` (les tables de Better Auth sont dans `src/db/auth-schema.ts`).
- `pnpm db:generate` crée une migration SQL dans `drizzle/` à partir du schéma.
- `pnpm db:migrate` applique les migrations à Neon si `DATABASE_URL` est défini, sinon au dossier PGlite.
- Les mêmes migrations servent en production, en local et dans les tests.

## Aliments génériques (CIQUAL)

- Source : Table de composition nutritionnelle des aliments Ciqual 2025, Anses, sous Licence Ouverte 2.0 (Etalab), https://doi.org/10.57745/RDMHWY. Le crédit est affiché dans l'app (recherche et fiche d'un Aliment générique).
- `data/ciqual-2025.csv` est un extrait compact, versionné, de la table officielle : code CIQUAL, nom, kcal, protéines (N × facteur de Jones), glucides, lipides, sucres, fibres, acides gras saturés et sel, pour 100 g. Conventions : « - » devient vide (inconnu), « traces » et « < x » deviennent 0. Les aliments sans kcal ou sans l'une des trois Macros sont écartés.
- `pnpm db:import-ciqual` importe ce fichier dans Neon (`DATABASE_URL`) ou dans PGlite. L'import est répétable : chaque Aliment est identifié par son code CIQUAL et mis à jour sur place, ce qui garde les liens des Entrées. `pnpm dev` et les tests Playwright le lancent après les migrations.
- Pour régénérer l'extrait (nouvelle version de CIQUAL) : télécharger `Table Ciqual 2025_FR_2025_11_03.xlsx` depuis https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260, exporter sa première feuille en CSV UTF-8 séparé par des virgules (`soffice --headless --convert-to csv …`), puis `pnpm exec tsx scripts/ciqual/deriver.ts <table.csv> data/ciqual-2025.csv`.
- La recherche se fait en plein texte français (`to_tsvector('french', …)`, index GIN) sur le nom sans accents ni casse (`normaliserRecherche` du noyau), chaque mot pris comme début de mot.

## Tests

| Commande | Seam |
| --- | --- |
| `pnpm test` | Vitest : le noyau nutritionnel (`src/core`) et les services (`src/services`, auth) contre PGlite en mémoire avec les migrations de production. |
| `pnpm test:e2e` | Playwright (Pixel 7 et iPhone 15) contre un build de production, sur une base PGlite neuve (`.pglite-e2e`). |
| `pnpm typecheck`, `pnpm lint` | TypeScript et ESLint. |

Première fois : `pnpm exec playwright install chromium webkit`.

## Déployer sur Vercel (étape manuelle)

1. Créer une base Neon et récupérer sa chaîne de connexion pooled.
2. Appliquer les migrations puis importer CIQUAL : `DATABASE_URL=… pnpm db:migrate && DATABASE_URL=… pnpm db:import-ciqual`.
3. Importer le repo dans Vercel (framework Next.js, `pnpm`), et définir `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` et `SIMCAL_ALLOWED_EMAILS`.
4. Pour les déploiements suivants, relancer `pnpm db:migrate` contre Neon avant chaque déploiement qui ajoute une migration (ou définir la commande de build Vercel à `pnpm db:migrate && pnpm build`).

Sur Vercel, sans `DATABASE_URL`, l'app refuse d'ouvrir une base (pas de repli sur PGlite).

## Organisation du code

- `src/core` : le noyau nutritionnel, pur (ni base de données ni framework).
- `src/sources` : les sources d'Aliments (interface `SourceAliments` : chercher par texte, trouver par Code-barres). CIQUAL (`sourceCiqual`, `importerAlimentsGeneriques`) en est la première.
- `src/services` : les services de l'application. Chaque fonction reçoit un `Contexte` `{ db, userId }` et ne lit ou n'écrit que les données de cet utilisateur.
- `src/lib/auth` : Better Auth (`createAuth` pour les tests, `getAuth`/`requireUser` pour l'app).
- `src/lib/profil.ts` : `requireProfil()`, à appeler dans chaque page qui dépend du Profil : tant qu'il n'est pas complet, elle redirige vers la première configuration (`/configuration`).
- `src/ui/textes.ts` : tous les textes de l'interface.
- `src/app` : les pages. `(public)` pour la connexion et l'inscription, `(app)` pour les pages qui exigent une session.
- `src/test` : les outils de test (`createTestDb`, `creerUtilisateur`).

## PWA et hors ligne

- Manifeste : `src/app/manifest.ts` ; icônes dans `public/` (source `public/icone.svg`) et `src/app/apple-icon.png` pour iOS.
- Service worker (Serwist, `src/app/sw.ts`, servi à `/serwist/sw.js`, production seulement) : il précache uniquement l'interface (fichiers de build, icônes, page `/~offline`). Aucune page, réponse RSC ou API n'est mise en cache, car elles contiennent des données personnelles. Hors ligne, toute page demandée affiche `/~offline`.
- Tout formulaire qui enregistre utilise la garde de `src/components/hors-ligne.tsx` : `const garde = useGardeHorsLigne()`, puis `<form onSubmit={garde.onSubmit}>` et `{garde.saisieBloquee && <AlerteHorsLigne />}`. Hors ligne, rien n'est envoyé ni mis en attente. Pour un envoi sans `<form>`, tester `useEnLigne()` avant d'envoyer.
