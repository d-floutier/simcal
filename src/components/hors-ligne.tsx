"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { WifiOff } from "lucide-react";
import { textes } from "@/ui/textes";

function abonner(changement: () => void) {
  window.addEventListener("online", changement);
  window.addEventListener("offline", changement);
  return () => {
    window.removeEventListener("online", changement);
    window.removeEventListener("offline", changement);
  };
}

/** true tant que le navigateur a du réseau (toujours true au rendu serveur). */
export function useEnLigne(): boolean {
  return useSyncExternalStore(
    abonner,
    () => navigator.onLine,
    () => true,
  );
}

/** Bandeau global, monté une fois dans le layout racine. */
export function IndicateurHorsLigne() {
  const enLigne = useEnLigne();
  return (
    <div role="status" aria-live="polite">
      {!enLigne && (
        <p className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-sm text-background">
          <WifiOff aria-hidden className="size-4" />
          {textes.horsLigne.indicateur}
        </p>
      )}
    </div>
  );
}

/**
 * Garde pour tout formulaire qui enregistre : hors ligne, la soumission est annulée
 * (rien n'est envoyé ni mis en attente) et `saisieBloquee` passe à true.
 *
 *   const garde = useGardeHorsLigne();
 *   <form action={action} onSubmit={garde.onSubmit}>
 *     {garde.saisieBloquee && <AlerteHorsLigne />}
 */
export function useGardeHorsLigne() {
  const enLigne = useEnLigne();
  const [tentativeHorsLigne, setTentativeHorsLigne] = useState(false);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const horsLigne = !navigator.onLine;
    if (horsLigne) event.preventDefault();
    setTentativeHorsLigne(horsLigne);
  }
  return { onSubmit, saisieBloquee: tentativeHorsLigne && !enLigne };
}

export function AlerteHorsLigne() {
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {textes.horsLigne.saisieImpossible}
    </p>
  );
}
