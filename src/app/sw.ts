/// <reference lib="webworker" />
// Service worker : met en cache l'interface (fichiers de build, icônes, page hors ligne)
// et rien d'autre. Pas de cache à l'exécution : les pages, réponses RSC et API
// contiennent des données personnelles et passent toujours par le réseau.
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  // Les pages passent par le réseau sans jamais être stockées ; cette route sert
  // seulement à brancher la page hors ligne quand le réseau échoue.
  runtimeCaching: [
    { matcher: ({ request }) => request.mode === "navigate", handler: new NetworkOnly() },
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
}).addEventListeners();
