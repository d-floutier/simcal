"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EtatFormulaire } from "@/app/(public)/actions";
import { textes } from "@/ui/textes";

type Props = {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  bouton: string;
  enCours: string;
  aideMotDePasse?: string;
  autocompleteMotDePasse: "current-password" | "new-password";
};

export function FormulaireIdentifiants(props: Props) {
  const [etat, action, enCours] = useActionState(props.action, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{textes.champs.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={etat.email}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="motDePasse">{textes.champs.motDePasse}</Label>
        <Input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete={props.autocompleteMotDePasse}
          required
          minLength={props.autocompleteMotDePasse === "new-password" ? 8 : undefined}
          className="h-10"
        />
        {props.aideMotDePasse && (
          <p className="text-xs text-muted-foreground">{props.aideMotDePasse}</p>
        )}
      </div>
      {etat.erreur && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10" disabled={enCours}>
        {enCours ? props.enCours : props.bouton}
      </Button>
    </form>
  );
}
