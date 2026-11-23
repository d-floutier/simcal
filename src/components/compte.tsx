"use client";

import { useActionState, useState } from "react";
import { Download } from "lucide-react";
import { supprimerCompteAction } from "@/app/(app)/reglages/actions";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textes } from "@/ui/textes";

const t = textes.compte;

/** L'export des données et la suppression du compte, confirmée dans la page en retapant l'email. */
export function DonneesDuCompte({ email }: { email: string }) {
  const [confirmer, setConfirmer] = useState(false);
  const [etat, action, enCours] = useActionState(supprimerCompteAction, {});
  const garde = useGardeHorsLigne();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t.titre}</h2>
        <p className="text-sm text-muted-foreground">{t.exportIntro}</p>
      </div>
      {/* Un lien de téléchargement : l'export est un fichier, pas une page. */}
      <a href="/reglages/export" download className={buttonVariants({ variant: "outline", size: "lg", className: "h-10" })}>
        <Download aria-hidden /> {t.exporter}
      </a>

      <div className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-destructive/30">
        <h3 className="font-semibold text-destructive">{t.suppressionTitre}</h3>
        <p className="text-sm text-muted-foreground">{t.suppressionIntro}</p>
        {!confirmer ? (
          <Button type="button" variant="destructive" size="lg" className="h-10" onClick={() => setConfirmer(true)}>
            {t.supprimer}
          </Button>
        ) : (
          <form action={action} onSubmit={garde.onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmation">{t.confirmationLibelle(email)}</Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="email"
                autoComplete="off"
                required
                autoFocus
                aria-invalid={!!etat.erreur || undefined}
                className="h-10"
              />
            </div>
            {garde.saisieBloquee && <AlerteHorsLigne />}
            {etat.erreur && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {etat.erreur}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" size="lg" className="h-10 flex-1" disabled={enCours}>
                {enCours ? t.enCours : t.confirmer}
              </Button>
              <Button type="button" variant="outline" size="lg" className="h-10" onClick={() => setConfirmer(false)}>
                {t.annuler}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
