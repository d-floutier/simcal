"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textes } from "@/ui/textes";

const t = textes.recherche;
// On attend une pause dans la frappe avant de chercher : moins d'appels à Open Food Facts,
// dont la limite (10 recherches par minute) est partagée par tous les utilisateurs.
const DELAI_SAISIE_MS = 400;

/** Le champ de recherche : met à jour `?q=` pendant la saisie, et la page affiche les résultats. */
export function ChampRecherche({ valeurInitiale }: { valeurInitiale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [valeur, setValeur] = useState(valeurInitiale);
  const [enCours, demarrer] = useTransition();
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(minuteur.current), []);

  function chercher(texte: string) {
    setValeur(texte);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const suivants = new URLSearchParams(params);
      if (texte.trim()) suivants.set("q", texte);
      else suivants.delete("q");
      demarrer(() => router.replace(`${pathname}?${suivants}`, { scroll: false }));
    }, DELAI_SAISIE_MS);
  }

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
      <Label htmlFor="recherche">{t.champ}</Label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="recherche"
          type="search"
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t.placeholder}
          value={valeur}
          onChange={(e) => chercher(e.target.value)}
          aria-busy={enCours || undefined}
          className="h-11 pl-9"
        />
      </div>
    </form>
  );
}
