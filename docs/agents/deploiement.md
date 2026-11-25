# Déploiement : lire Vercel depuis le terminal

Le repo est lié au projet Vercel `dfloutiers-projects/simcal` (`.vercel/`, gitignoré) et la CLI `vercel` est connectée. Lis les logs toi-même plutôt que de demander à l'utilisateur de les coller.

- **Lister les déploiements** : `vercel ls simcal`. La colonne Environment distingue Preview et Production.
- **Log de build d'un déploiement** : `vercel inspect <url-du-déploiement> --logs`. L'URL vient de `vercel ls`, ou du check `Vercel` d'une PR (`gh pr checks <n>`).
- **Logs runtime** : `vercel logs --environment production --query 'level:error'`, sans `--since`. Le plan Hobby ne garde que les 30 dernières minutes : une fenêtre plus large renvoie `outside the available retention`. Pour une erreur plus ancienne, fais reproduire l'erreur, puis relis.
- **Variables d'environnement** : `vercel env ls`. Les valeurs de prod sont aussi dans `.env.prod` (gitignoré) ; ne les affiche jamais.

Avant de pousser un changement qui touche au build, rejoue le build Vercel sans base : `VERCEL=1 DATABASE_URL= pnpm db:migrate && VERCEL=1 DATABASE_URL= pnpm build` (c'est aussi l'étape finale de la CI).
