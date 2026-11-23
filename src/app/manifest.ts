import type { MetadataRoute } from "next";
import { COULEUR_FOND, COULEUR_THEME } from "@/ui/pwa";
import { textes } from "@/ui/textes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: textes.app.nom,
    short_name: textes.app.nom,
    description: textes.app.description,
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: COULEUR_FOND,
    theme_color: COULEUR_THEME,
    // Fond plein et motif dans la zone sûre : la même icône sert de « maskable ».
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
