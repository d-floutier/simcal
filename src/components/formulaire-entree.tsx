"use client";

import { useActionState, useState } from "react";
import {
  quantiteEnGrammes,
  REPAS,
  valeursEntree,
  type Quantite,
  type Repas,
  type ValeursNutritionnelles,
} from "@/core";
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
import type { Portion, QuantiteEntree } from "@/services";
import { formaterQuantite, textes } from "@/ui/textes";

const t = textes.entree;

type Props = {
  pour100g: ValeursNutritionnelles;
  repas: Repas;
  /** La quantité déjà notée (modification), et son équivalent en grammes. */
  quantite?: QuantiteEntree;
  grammes?: number;
  uniteParDefaut: "g" | "ml";
  /** Les Portions de l'Aliment, proposées à la place des grammes. */
  portions?: Portion[];
} & ({ mode: "ajout"; alimentId: string; jour: string } | { mode: "modification"; entreeId: string });

const lireNombre = (s: string) => (s.trim() === "" ? Number.NaN : Number(s.replace(",", ".")));
const afficherNombre = (n: number) => String(n).replace(".", ",");
/** La valeur du choix d'unité pour une Portion (lue par l'action). */
const valeurPortion = (id: string) => `portion:${id}`;

/** L'unité et la quantité affichées au départ. Une Portion supprimée depuis repasse en grammes. */
function saisieInitiale(props: Props): { unite: string; quantite: string } {
  const q = props.quantite;
  if (!q) return { unite: props.uniteParDefaut, quantite: "100" };
  if (q.unite !== "portion") return { unite: q.unite, quantite: afficherNombre(q.valeur) };
  if (q.portionId && props.portions?.some((p) => p.id === q.portionId)) {
    return { unite: valeurPortion(q.portionId), quantite: afficherNombre(q.nombre) };
  }
  return { unite: "g", quantite: afficherNombre(props.grammes ?? q.nombre * q.grammesParPortion) };
}

/**
 * La saisie d'une Entrée : quantité en g, en ml ou en Portions de l'Aliment, et Repas. Les kcal et
 * les Macros de l'Entrée sont recalculées par le noyau pendant la saisie.
 */
export function FormulaireEntree(props: Props) {
  const action = props.mode === "ajout" ? ajouterEntreeAction : modifierEntreeAction;
  const [etat, envoyer, enCours] = useActionState<EtatEntree, FormData>(action, {});
  const garde = useGardeHorsLigne();
  const initiale = saisieInitiale(props);
  const [quantite, setQuantite] = useState(initiale.quantite);
  const [unite, setUnite] = useState(initiale.unite);
  const portions = props.portions ?? [];
  const portion = portions.find((p) => valeurPortion(p.id) === unite);
  const saisie: Quantite = portion
    ? { unite: "portion", nombre: lireNombre(quantite), grammesParPortion: portion.grammes }
    : { unite: unite === "ml" ? "ml" : "g", valeur: lireNombre(quantite) };
  const grammes = quantiteEnGrammes(saisie);
  const apercu = grammes > 0 ? valeursEntree(props.pour100g, grammes) : null;

  function changerUnite(nouvelle: string) {
    const enPortion = portions.some((p) => valeurPortion(p.id) === nouvelle);
    // Passer des grammes aux Portions (ou l'inverse) repart d'une quantité usuelle.
    if (enPortion && !portion) setQuantite("1");
    if (!enPortion && portion) setQuantite("100");
    setUnite(nouvelle);
  }
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

        <div className={`grid gap-3 ${portions.length > 0 ? "grid-cols-[6rem_1fr]" : "grid-cols-[1fr_6rem]"}`}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantite">{portion ? t.nombre : t.quantite}</Label>
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
              onChange={(e) => changerUnite(e.target.value)}
              className="h-10 min-w-0 rounded-lg border border-input bg-transparent px-2 text-base md:text-sm dark:bg-input/30"
            >
              {portions.map((p) => (
                <option key={p.id} value={valeurPortion(p.id)}>
                  {p.nom}
                </option>
              ))}
              <option value="g">{t.unites.g}</option>
              <option value="ml">{t.unites.ml}</option>
            </select>
          </div>
        </div>
        {erreurQuantite ? (
          <p id="quantite-erreur" className="-mt-2 text-sm text-destructive">
            {t.erreurs.quantite}
          </p>
        ) : portion ? (
          <p id="quantite-aide" className="-mt-2 text-xs text-muted-foreground">
            {t.aidePortion(portion.nom, formaterQuantite(portion.grammes, props.uniteParDefaut))}
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
