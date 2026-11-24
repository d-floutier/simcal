import { useId } from "react";
import type { ObjectifCalcule } from "@/core";
import { formaterGrammes, formaterKcal, textes } from "@/ui/textes";

const t = textes.objectif;
const MACROS = ["glucides", "proteines", "lipides"] as const;

type Props = {
  objectif: ObjectifCalcule | null;
  titre: string;
  /** Affiche aussi la Dépense de repos et la Dépense totale (d'où vient le chiffre). */
  detail?: boolean;
  masquerMacros?: boolean;
};

/** L'Objectif calorique et les cibles de Macros, arrondis pour l'affichage. */
export function ResumeObjectif({ objectif, titre, detail = true, masquerMacros = false }: Props) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10"
    >
      <h2 id={id} className="text-base font-semibold">
        {titre}
      </h2>
      {!objectif ? (
        <p className="text-muted-foreground">{t.incomplet}</p>
      ) : (
        <>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            {detail && (
              <>
                <dt className="text-muted-foreground">{t.depenseRepos}</dt>
                <dd className="text-right tabular-nums">{formaterKcal(objectif.depenseRepos)}</dd>
                <dt className="text-muted-foreground">{t.depenseTotale}</dt>
                <dd className="text-right tabular-nums">{formaterKcal(objectif.depenseTotale)}</dd>
              </>
            )}
            <dt className="font-medium">{t.objectifCalorique}</dt>
            <dd className="text-right text-base font-semibold tabular-nums">{formaterKcal(objectif.kcal)}</dd>
          </dl>
          {!masquerMacros && (
            <dl className="grid grid-cols-3 gap-2 text-center">
              {MACROS.map((m) => (
                <div key={m} className="flex flex-col rounded-lg bg-muted px-2 py-2">
                  <dt className="text-xs text-muted-foreground">{textes.profil.macros[m]}</dt>
                  <dd className="font-medium tabular-nums">{formaterGrammes(objectif.macros[m])}</dd>
                </div>
              ))}
            </dl>
          )}
          {objectif.plancherApplique && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-200">
              {t.plancherApplique(objectif.plancher)}
            </p>
          )}
        </>
      )}
    </section>
  );
}
