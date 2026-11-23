import { WifiOff } from "lucide-react";
import { textes } from "@/ui/textes";
import { BoutonReessayer } from "./bouton-reessayer";

// Page statique mise en cache par le service worker et servie à la place de toute
// page demandée hors ligne. Elle ne contient aucune donnée personnelle.
export default function HorsLignePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <span className="text-lg font-bold tracking-tight text-primary">{textes.app.nom}</span>
      <WifiOff aria-hidden className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">{textes.horsLigne.pageTitre}</h1>
      <p className="text-sm text-muted-foreground">{textes.horsLigne.pageTexte}</p>
      <BoutonReessayer />
    </main>
  );
}
