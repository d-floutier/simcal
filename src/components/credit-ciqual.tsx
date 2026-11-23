import { textes } from "@/ui/textes";

/** Le crédit de la source CIQUAL (Licence Ouverte : citer la source). */
export function CreditCiqual() {
  return (
    <p className="text-xs text-muted-foreground">
      {textes.sources.ciqual}{" "}
      <a href={textes.sources.ciqualUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
        {textes.sources.ciqualUrl}
      </a>
    </p>
  );
}

/** Le crédit d'Open Food Facts (ODbL : citer la source et sa licence). */
export function CreditOpenFoodFacts() {
  return (
    <p className="text-xs text-muted-foreground">
      {textes.sources.openFoodFacts}{" "}
      <a href={textes.sources.openFoodFactsUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
        openfoodfacts.org
      </a>
      {" · "}
      <a href={textes.sources.odblUrl} className="underline underline-offset-2" target="_blank" rel="noreferrer">
        {textes.sources.odbl}
      </a>
    </p>
  );
}
