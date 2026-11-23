# 12: PWA installable

**What to build:** Sur mon téléphone, je peux installer Simcal sur l'écran d'accueil et l'ouvrir comme une app. Hors ligne, l'interface s'ouvre quand même. Si j'essaie de noter quelque chose, un message clair m'indique qu'il faut une connexion, et je ne crois pas que ma saisie est enregistrée.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] L'app a un manifeste (nom Simcal, icône, couleur) et peut être installée sur iOS et Android
- [ ] Un service worker met en cache l'interface seulement, jamais les données personnelles
- [ ] Hors ligne, l'app s'ouvre et affiche un indicateur de déconnexion
- [ ] Une saisie tentée hors ligne affiche un message clair et rien ne semble enregistré
