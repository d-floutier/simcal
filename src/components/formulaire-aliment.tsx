"use client";

import { useActionState, type ReactNode } from "react";
import { NUTRIMENTS_FACULTATIFS } from "@/core";
import {
  enregistrerAlimentAction,
  supprimerAlimentAction,
  type EtatAliment,
} from "@/app/(app)/mes-aliments/actions";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChampAlimentPersonnalise, FicheAliment } from "@/services";
import { textes } from "@/ui/textes";

const t = textes.personnalises;
const MACROS = ["proteines", "glucides", "lipides"] as const;
const enTexte = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/**
 * La création (sans `aliment`) ou la modification d'un Aliment personnalisé : nom, valeurs pour
 * 100 g ou 100 ml, kcal et Macros obligatoires, autres nutriments et Code-barres facultatifs.
 */
export function FormulaireAliment({ aliment, codeBarres }: { aliment?: FicheAliment; codeBarres?: string }) {
  const [etat, envoyer, enCours] = useActionState<EtatAliment, FormData>(enregistrerAlimentAction, {});
  const garde = useGardeHorsLigne();
  const erreur = (c: ChampAlimentPersonnalise) => (etat.erreurs?.includes(c) ? t.erreurs[c] : undefined);
  const champNombre = (champ: ChampAlimentPersonnalise, label: string, requis: boolean) => (
    <Champ key={champ} id={champ} label={label} erreur={erreur(champ)}>
      <Input
        id={champ}
        name={champ}
        inputMode="decimal"
        required={requis}
        defaultValue={enTexte(aliment?.valeurs[champ as keyof FicheAliment["valeurs"]])}
        aria-invalid={!!erreur(champ) || undefined}
        className="h-10"
      />
    </Champ>
  );

  return (
    <form action={envoyer} onSubmit={garde.onSubmit} className="flex flex-col gap-4">
      {aliment && <input type="hidden" name="id" value={aliment.id} />}
      <Champ id="nom" label={t.nom} erreur={erreur("nom")}>
        <Input
          id="nom"
          name="nom"
          required
          maxLength={200}
          defaultValue={aliment?.nom ?? ""}
          aria-invalid={!!erreur("nom") || undefined}
          className="h-10"
        />
      </Champ>
      <Champ id="unite" label={t.unite} erreur={erreur("unite")}>
        <select
          id="unite"
          name="unite"
          defaultValue={aliment?.unite ?? "g"}
          className="h-10 rounded-lg border border-input bg-transparent px-2 text-base md:text-sm dark:bg-input/30"
        >
          <option value="g">{t.unites.g}</option>
          <option value="ml">{t.unites.ml}</option>
        </select>
      </Champ>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="pb-2 text-sm font-medium">{t.obligatoires}</legend>
        {champNombre("kcal", t.kcal, true)}
        {MACROS.map((m) => champNombre(m, t.nutriment(textes.nutriments[m]), true))}
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="pb-2 text-sm font-medium">{t.facultatifs}</legend>
        {NUTRIMENTS_FACULTATIFS.map((n) => champNombre(n, t.nutriment(textes.nutriments[n]), false))}
      </fieldset>

      <Champ id="codeBarres" label={t.codeBarres} erreur={erreur("codeBarres")}>
        <Input
          id="codeBarres"
          name="codeBarres"
          inputMode="numeric"
          defaultValue={aliment?.codeBarres ?? codeBarres ?? ""}
          aria-invalid={!!erreur("codeBarres") || undefined}
          className="h-10"
        />
      </Champ>

      {garde.saisieBloquee && <AlerteHorsLigne />}
      {(etat.erreur || etat.erreurs) && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur ?? t.erreurGenerale}
        </p>
      )}
      {etat.enregistre && (
        <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {t.enregistre}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10" disabled={enCours}>
        {enCours ? t.enCours : t.bouton}
      </Button>
    </form>
  );
}

export function BoutonSupprimerAliment({ alimentId }: { alimentId: string }) {
  const [etat, envoyer, enCours] = useActionState<EtatAliment, FormData>(supprimerAlimentAction, {});
  const garde = useGardeHorsLigne();
  return (
    <form action={envoyer} onSubmit={garde.onSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={alimentId} />
      <p className="text-xs text-muted-foreground">{t.aideSuppression}</p>
      {garde.saisieBloquee && <AlerteHorsLigne />}
      {etat.erreur && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur}
        </p>
      )}
      <Button type="submit" variant="destructive" size="lg" className="h-10" disabled={enCours}>
        {enCours ? t.suppressionEnCours : t.supprimer}
      </Button>
    </form>
  );
}

function Champ({ id, label, erreur, children }: { id: string; label: string; erreur?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}
    </div>
  );
}
