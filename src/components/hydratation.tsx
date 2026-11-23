"use client";

import { useActionState, useId, type ReactNode } from "react";
import { GlassWater, Minus } from "lucide-react";
import {
  ajouterVerreAction,
  modifierReglagesHydratationAction,
  retirerVerreAction,
} from "@/app/(app)/hydratation/actions";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChampHydratation, HydratationDuJour, ReglagesHydratation } from "@/services";
import { formaterLitres, formaterNombre, textes } from "@/ui/textes";

const t = textes.hydratation;
const ml = (n: number) => `${formaterNombre(n)} ml`;

/** L'Hydratation du jour affiché, comparée à son Objectif d'hydratation, avec l'ajout d'un Verre en un tap. */
export function SuiviHydratation({ hydratation }: { hydratation: HydratationDuJour }) {
  const id = useId();
  const garde = useGardeHorsLigne();
  const [etatAjout, ajouter, ajoutEnCours] = useActionState(ajouterVerreAction, {});
  const [etatRetrait, retirer, retraitEnCours] = useActionState(retirerVerreAction, {});
  const { jour, totalMl, objectifMl, verreMl, ajouts } = hydratation;
  const pct = Math.min(100, Math.round((totalMl / objectifMl) * 100));
  const erreur = etatAjout.erreur ?? etatRetrait.erreur;

  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="text-base font-semibold">
          {t.titre}
        </h2>
        <p className="tabular-nums" aria-label={t.progression(formaterLitres(totalMl), formaterLitres(objectifMl))}>
          <span className="font-semibold">{formaterLitres(totalMl)}</span>
          <span className="text-muted-foreground"> / {formaterLitres(objectifMl)}</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t.titre}
        aria-valuemin={0}
        aria-valuemax={objectifMl}
        aria-valuenow={totalMl}
        aria-valuetext={t.progression(formaterLitres(totalMl), formaterLitres(objectifMl))}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {totalMl >= objectifMl && <p className="text-primary">{t.atteint}</p>}
      <div className="flex gap-2">
        <form action={ajouter} onSubmit={garde.onSubmit} className="flex-1">
          <input type="hidden" name="jour" value={jour} />
          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={ajoutEnCours}
            aria-label={t.ajouterVerreLibelle(ml(verreMl))}
          >
            <GlassWater aria-hidden /> {t.ajouterVerre(ml(verreMl))}
          </Button>
        </form>
        <form action={retirer} onSubmit={garde.onSubmit}>
          <input type="hidden" name="jour" value={jour} />
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="h-10"
            disabled={retraitEnCours || ajouts === 0}
          >
            <Minus aria-hidden /> {t.retirerVerre}
          </Button>
        </form>
      </div>
      {garde.saisieBloquee && <AlerteHorsLigne />}
      {erreur && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t.nonCompte}</p>
    </section>
  );
}

/** Les réglages : Objectif d'hydratation et taille du Verre. */
export function FormulaireHydratation({ reglages }: { reglages: ReglagesHydratation }) {
  const [etat, action, enCours] = useActionState(modifierReglagesHydratationAction, {});
  const garde = useGardeHorsLigne();
  const erreur = (c: ChampHydratation) => (etat.erreurs?.includes(c) ? t.erreurs[c] : undefined);

  return (
    <form action={action} onSubmit={garde.onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t.reglages.titre}</h2>
        <p className="text-sm text-muted-foreground">{t.reglages.intro}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Champ id="objectifMl" label={t.reglages.objectifMl} erreur={erreur("objectifMl")}>
          <Input
            id="objectifMl"
            name="objectifMl"
            type="number"
            inputMode="numeric"
            step={1}
            min={250}
            max={10000}
            required
            defaultValue={String(reglages.objectifMl)}
            aria-invalid={!!erreur("objectifMl") || undefined}
            className="h-10"
          />
        </Champ>
        <Champ id="verreMl" label={t.reglages.verreMl} erreur={erreur("verreMl")}>
          <Input
            id="verreMl"
            name="verreMl"
            type="number"
            inputMode="numeric"
            step={1}
            min={10}
            max={2000}
            required
            defaultValue={String(reglages.verreMl)}
            aria-invalid={!!erreur("verreMl") || undefined}
            className="h-10"
          />
        </Champ>
      </div>
      {garde.saisieBloquee && <AlerteHorsLigne />}
      {etat.erreur && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur}
        </p>
      )}
      {etat.enregistre && (
        <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {t.reglages.enregistre}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10" disabled={enCours}>
        {enCours ? t.reglages.enCours : t.reglages.bouton}
      </Button>
    </form>
  );
}

function Champ(props: { id: string; label: string; erreur?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.erreur && <p className="text-xs text-destructive">{props.erreur}</p>}
    </div>
  );
}
