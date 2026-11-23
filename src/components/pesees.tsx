"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import {
  enregistrerPeseeAction,
  repondrePropositionAction,
  supprimerPeseeAction,
} from "@/app/(app)/pesees/actions";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textes } from "@/ui/textes";

const t = textes.pesees;

type PropsFormulaire = {
  aujourdhui: string;
  /** La Pesée à modifier, sinon une nouvelle Pesée pour aujourd'hui. */
  pesee?: { jour: string; poidsKg: number };
};

export function FormulairePesee({ aujourdhui, pesee }: PropsFormulaire) {
  const [etat, action, enCours] = useActionState(enregistrerPeseeAction, {});
  const garde = useGardeHorsLigne();
  const erreur = (c: "jour" | "poidsKg") => (etat.erreurs?.includes(c) ? t.erreurs[c] : undefined);

  return (
    <form action={action} onSubmit={garde.onSubmit} className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">{pesee ? t.modification : t.nouvelle}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Champ id="jour" label={t.jour} erreur={erreur("jour")}>
          <Input
            id="jour"
            name="jour"
            type="date"
            required
            max={aujourdhui}
            defaultValue={pesee?.jour ?? aujourdhui}
            readOnly={!!pesee}
            aria-invalid={!!erreur("jour") || undefined}
            className="h-10"
          />
        </Champ>
        <Champ id="poidsKg" label={t.poidsKg} erreur={erreur("poidsKg")}>
          <Input
            id="poidsKg"
            name="poidsKg"
            type="number"
            inputMode="decimal"
            step="any"
            min={20}
            max={500}
            required
            defaultValue={pesee ? String(pesee.poidsKg) : ""}
            aria-invalid={!!erreur("poidsKg") || undefined}
            className="h-10"
          />
        </Champ>
      </div>
      {!pesee && <p className="text-xs text-muted-foreground">{t.remplace}</p>}
      {garde.saisieBloquee && <AlerteHorsLigne />}
      {etat.erreur && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur}
        </p>
      )}
      {etat.enregistree && (
        <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {t.enregistree}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="h-10 flex-1" disabled={enCours}>
          {enCours ? t.enCours : t.bouton}
        </Button>
        {pesee && (
          <Link href="/pesees" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10" })}>
            {t.annuler}
          </Link>
        )}
      </div>
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

export function BoutonSupprimerPesee({ jour, libelle }: { jour: string; libelle: string }) {
  const garde = useGardeHorsLigne();
  return (
    <form action={supprimerPeseeAction} onSubmit={garde.onSubmit} className="contents">
      <input type="hidden" name="jour" value={jour} />
      <Button type="submit" variant="ghost" size="sm" aria-label={libelle}>
        {t.supprimer}
      </Button>
      {garde.saisieBloquee && (
        <div className="col-span-full">
          <AlerteHorsLigne />
        </div>
      )}
    </form>
  );
}

export function PropositionMaintien() {
  const garde = useGardeHorsLigne();
  return (
    <section
      aria-labelledby="proposition-maintien"
      className="flex flex-col gap-3 rounded-xl bg-primary/10 p-4 text-sm ring-1 ring-primary/30"
    >
      <h2 id="proposition-maintien" className="text-base font-semibold">
        {t.proposition.titre}
      </h2>
      <p>{t.proposition.texte}</p>
      <form action={repondrePropositionAction} onSubmit={garde.onSubmit} className="flex flex-wrap gap-2">
        <Button type="submit" name="reponse" value="accepter" className="h-10">
          {t.proposition.accepter}
        </Button>
        <Button type="submit" name="reponse" value="refuser" variant="outline" className="h-10">
          {t.proposition.refuser}
        </Button>
      </form>
      {garde.saisieBloquee && <AlerteHorsLigne />}
    </section>
  );
}
