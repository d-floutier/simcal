"use client";

import { useActionState, useState } from "react";
import { quantiteEnGrammes, REPAS, valeursEntree, type Repas, type ValeursNutritionnelles } from "@/core";
import {
  ajouterEntreeAction,
  modifierEntreeAction,
  supprimerEntreeAction,
  type EtatEntree,
} from "@/app/(app)/actions-journal";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { TableauNutriments } from "@/components/tableau-nutriments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textes } from "@/ui/textes";

const t = textes.entree;

type Props = {
  pour100g: ValeursNutritionnelles;
  repas: Repas;
  quantite?: { unite: "g" | "ml"; valeur: number };
  uniteParDefaut: "g" | "ml";
} & ({ mode: "ajout"; alimentId: string; jour: string } | { mode: "modification"; entreeId: string });

const lireNombre = (s: string) => (s.trim() === "" ? Number.NaN : Number(s.replace(",", ".")));

/**
 * La saisie d'une Entrée : quantité en g ou en ml et Repas. Les kcal et les Macros de l'Entrée
 * sont recalculées par le noyau pendant la saisie.
 */
export function FormulaireEntree(props: Props) {
  const action = props.mode === "ajout" ? ajouterEntreeAction : modifierEntreeAction;
  const [etat, envoyer, enCours] = useActionState<EtatEntree, FormData>(action, {});
  const garde = useGardeHorsLigne();
  const [quantite, setQuantite] = useState(props.quantite ? String(props.quantite.valeur).replace(".", ",") : "100");
  const [unite, setUnite] = useState(props.quantite?.unite ?? props.uniteParDefaut);
  const grammes = quantiteEnGrammes({ unite, valeur: lireNombre(quantite) });
  const apercu = grammes > 0 ? valeursEntree(props.pour100g, grammes) : null;
  const erreurQuantite = etat.erreurs?.includes("quantite");

  return (
    <div className="flex flex-col gap-4">
      <form action={envoyer} onSubmit={garde.onSubmit} className="flex flex-col gap-4">
        {props.mode === "ajout" ? (
          <>
            <input type="hidden" name="alimentId" value={props.alimentId} />
            <input type="hidden" name="jour" value={props.jour} />
          </>
        ) : (
          <input type="hidden" name="id" value={props.entreeId} />
        )}

        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantite">{t.quantite}</Label>
            <Input
              id="quantite"
              name="quantite"
              inputMode="decimal"
              required
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              aria-invalid={erreurQuantite || undefined}
              aria-describedby={erreurQuantite ? "quantite-erreur" : "quantite-aide"}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unite">{t.unite}</Label>
            <select
              id="unite"
              name="unite"
              value={unite}
              onChange={(e) => setUnite(e.target.value as "g" | "ml")}
              className="h-10 rounded-lg border border-input bg-transparent px-2 text-base md:text-sm dark:bg-input/30"
            >
              <option value="g">{t.unites.g}</option>
              <option value="ml">{t.unites.ml}</option>
            </select>
          </div>
        </div>
        {erreurQuantite ? (
          <p id="quantite-erreur" className="-mt-2 text-sm text-destructive">
            {t.erreurs.quantite}
          </p>
        ) : (
          unite === "ml" && (
            <p id="quantite-aide" className="-mt-2 text-xs text-muted-foreground">
              {t.aideMillilitres}
            </p>
          )
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="repas">{t.repas}</Label>
          <select
            id="repas"
            name="repas"
            defaultValue={props.repas}
            className="h-10 rounded-lg border border-input bg-transparent px-2 text-base md:text-sm dark:bg-input/30"
          >
            {REPAS.map((r) => (
              <option key={r} value={r}>
                {textes.repas[r]}
              </option>
            ))}
          </select>
        </div>

        <section aria-live="polite" className="rounded-xl bg-muted/50 p-3">
          {apercu && <TableauNutriments valeurs={apercu} titre={t.apercu} />}
        </section>

        {garde.saisieBloquee && <AlerteHorsLigne />}
        {(etat.erreur || etat.erreurs?.some((c) => c !== "quantite")) && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {etat.erreur ?? etat.erreurs!.filter((c) => c !== "quantite").map((c) => t.erreurs[c]).join(" ")}
          </p>
        )}
        <Button type="submit" size="lg" className="h-10" disabled={enCours}>
          {enCours ? t.enCours : props.mode === "ajout" ? t.ajouter : t.enregistrer}
        </Button>
      </form>
      {props.mode === "modification" && <BoutonSupprimer entreeId={props.entreeId} />}
    </div>
  );
}

function BoutonSupprimer({ entreeId }: { entreeId: string }) {
  const [etat, envoyer, enCours] = useActionState<EtatEntree, FormData>(supprimerEntreeAction, {});
  const garde = useGardeHorsLigne();
  return (
    <form action={envoyer} onSubmit={garde.onSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={entreeId} />
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
