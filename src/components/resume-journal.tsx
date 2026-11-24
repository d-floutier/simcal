import { useId } from "react";
import type { Macros, ObjectifCalcule } from "@/core";
import { formaterGrammes, formaterKcal, textes } from "@/ui/textes";

const t = textes.journal;
const MACROS = ["glucides", "proteines", "lipides"] as const;

type Props = { titre: string; total: Macros; objectif: ObjectifCalcule | null; reste: Macros | null };

/** Les kcal et les Macros consommées le jour donné, comparées à l'objectif du jour. */
export function ResumeJournal({ titre, total, objectif, reste }: Props) {
  const id = useId();
  const depasse = reste !== null && reste.kcal < 0;
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10"
    >
      <h2 id={id} className="text-base font-semibold">
        {titre}
      </h2>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">{t.consomme}</dt>
          <dd className="font-semibold tabular-nums">{formaterKcal(total.kcal)}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">{t.objectif}</dt>
          <dd className="font-semibold tabular-nums">{objectif ? formaterKcal(objectif.kcal) : "—"}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs text-muted-foreground">{depasse ? t.depassement : t.reste}</dt>
          <dd className={`font-semibold tabular-nums ${depasse ? "text-destructive" : "text-primary"}`}>
            {reste ? formaterKcal(Math.abs(reste.kcal)) : "—"}
          </dd>
        </div>
      </dl>
      {objectif ? (
        <dl className="grid grid-cols-3 gap-2 text-center">
          {MACROS.map((m) => (
            <div key={m} className="flex flex-col rounded-lg bg-muted px-2 py-2">
              <dt className="text-xs text-muted-foreground">{textes.profil.macros[m]}</dt>
              <dd className="font-medium tabular-nums">
                {formaterGrammes(total[m])} / {formaterGrammes(objectif.macros[m])}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground">{t.sansObjectif}</p>
      )}
    </section>
  );
}
