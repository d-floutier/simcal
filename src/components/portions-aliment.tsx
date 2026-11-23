"use client";

import { useActionState } from "react";
import {
  enregistrerPortionAction,
  supprimerPortionAction,
  type EtatPortion,
} from "@/app/(app)/mes-aliments/actions";
import { AlerteHorsLigne, useEnLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Portion } from "@/services";
import { textes } from "@/ui/textes";

const t = textes.personnalises;

/** Les Portions d'un Aliment personnalisé : chacune modifiable et supprimable, et l'ajout d'une nouvelle. */
export function PortionsAliment({
  alimentId,
  unite,
  portions,
}: {
  alimentId: string;
  unite: "g" | "ml";
  portions: Portion[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {portions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.aucunePortion}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {portions.map((p) => (
            <li key={`${p.id}-${p.nom}-${p.grammes}`} className="flex flex-col gap-2 border-b pb-3">
              <FormulairePortion alimentId={alimentId} unite={unite} portion={p} />
            </li>
          ))}
        </ul>
      )}
      <FormulairePortion key={portions.length} alimentId={alimentId} unite={unite} />
    </div>
  );
}

function FormulairePortion({ alimentId, unite, portion }: { alimentId: string; unite: "g" | "ml"; portion?: Portion }) {
  const [etat, envoyer, enCours] = useActionState<EtatPortion, FormData>(enregistrerPortionAction, {});
  const garde = useGardeHorsLigne();
  const enLigne = useEnLigne();
  const suffixe = portion?.id ?? "nouvelle";
  const erreur = (c: "nom" | "grammes") => (etat.erreurs?.includes(c) ? t.erreursPortion[c] : undefined);

  return (
    <div className="flex flex-col gap-2">
      <form action={envoyer} onSubmit={garde.onSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="alimentId" value={alimentId} />
        {portion && <input type="hidden" name="portionId" value={portion.id} />}
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`nom-${suffixe}`}>{t.nomPortion}</Label>
            <Input
              id={`nom-${suffixe}`}
              name="nom"
              required
              maxLength={200}
              placeholder={portion ? undefined : "1 bol"}
              defaultValue={portion?.nom ?? ""}
              aria-invalid={!!erreur("nom") || undefined}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`grammes-${suffixe}`}>{t.grammesPortion(unite)}</Label>
            <Input
              id={`grammes-${suffixe}`}
              name="grammes"
              inputMode="decimal"
              required
              defaultValue={portion ? String(portion.grammes).replace(".", ",") : ""}
              aria-invalid={!!erreur("grammes") || undefined}
              className="h-10"
            />
          </div>
        </div>
        {(erreur("nom") || erreur("grammes")) && (
          <p className="text-sm text-destructive">{[erreur("nom"), erreur("grammes")].filter(Boolean).join(" ")}</p>
        )}
        {garde.saisieBloquee && <AlerteHorsLigne />}
        {etat.erreur && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {etat.erreur}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant={portion ? "outline" : "default"} className="h-10 flex-1" disabled={enCours}>
            {portion ? t.enregistrerPortion : t.ajouterPortion}
          </Button>
          {portion && (
            <Button
              type="submit"
              variant="destructive"
              className="h-10"
              formAction={supprimerPortionAction}
              formNoValidate
              disabled={!enLigne}
              aria-label={t.supprimerPortionLibelle(portion.nom)}
            >
              {t.supprimerPortion}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
