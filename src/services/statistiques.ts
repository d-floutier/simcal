import { and, asc, eq, gte, lte } from "drizzle-orm";
import {
  calculerObjectif,
  jourCalendaire,
  joursDeLaPeriode,
  moyenneMacros,
  totauxParJour,
  type Jour,
  type Macros,
} from "@/core";
import { entree, objectifHistorique } from "@/db/schema";
import type { Contexte } from "./contexte";
import { listerPesees, type Pesee } from "./pesees";
import { lireProfil, versParametres } from "./profil";

export type PeriodeStatistiques = 7 | 30;

export type JourStatistiques = {
  jour: Jour;
  /** Les kcal consommées ce jour-là, null pour un jour sans Entrée (pas 0). */
  kcal: number | null;
  /** L'Objectif calorique en vigueur ce jour-là, null avant la première configuration. */
  objectifKcal: number | null;
};

export type Statistiques = {
  du: Jour;
  au: Jour;
  /** Chaque jour de la période, du plus ancien à aujourd'hui. */
  jours: JourStatistiques[];
  joursAvecEntree: number;
  /** La moyenne des kcal et Macros sur les seuls jours avec Entrée (null sans aucun). */
  moyenne: Macros | null;
  /** L'Objectif calorique et les cibles de Macros d'aujourd'hui. */
  cibles: Macros | null;
  /** Les Pesées de la période, de la plus ancienne à la plus récente. */
  pesees: Pesee[];
  /** Le Poids cible de l'Objectif actuel, null pour « maintenir ». */
  poidsCibleKg: number | null;
};

/** Les statistiques des 7 ou 30 derniers jours, aujourd'hui compris (fuseau du Profil). */
export async function statistiques(
  ctx: Contexte,
  periode: { jours: PeriodeStatistiques },
  instant: Date = new Date(),
): Promise<Statistiques> {
  const profil = await lireProfil(ctx);
  const au = jourCalendaire(instant, profil?.fuseau ?? "UTC");
  const jours = joursDeLaPeriode(au, periode.jours);
  const du = jours[0];

  const [lignes, historique, pesees] = await Promise.all([
    ctx.db
      .select({
        jour: entree.jour,
        grammes: entree.grammes,
        kcal: entree.kcal,
        proteines: entree.proteines,
        glucides: entree.glucides,
        lipides: entree.lipides,
      })
      .from(entree)
      .where(and(eq(entree.userId, ctx.userId), gte(entree.jour, du), lte(entree.jour, au))),
    ctx.db
      .select()
      .from(objectifHistorique)
      .where(and(eq(objectifHistorique.userId, ctx.userId), lte(objectifHistorique.depuis, au)))
      .orderBy(asc(objectifHistorique.depuis)),
    listerPesees(ctx, { du, au }),
  ]);

  const totaux = totauxParJour(
    jours,
    lignes.map((l) => {
      const f = l.grammes / 100;
      return {
        jour: l.jour,
        valeurs: { kcal: l.kcal * f, proteines: l.proteines * f, glucides: l.glucides * f, lipides: l.lipides * f },
      };
    }),
  );

  // L'objectif d'un jour est le dernier enregistré à cette date ou avant.
  const objectifLe = (jour: Jour) => {
    const ligne = historique.findLast((h) => h.depuis <= jour);
    return ligne ? calculerObjectif(versParametres(ligne), jour) : null;
  };
  const aujourdhui = objectifLe(au);
  const o = profil?.objectif;

  return {
    du,
    au,
    jours: totaux.map(({ jour, total }) => ({
      jour,
      kcal: total?.kcal ?? null,
      objectifKcal: objectifLe(jour)?.kcal ?? null,
    })),
    joursAvecEntree: totaux.filter((t) => t.total !== null).length,
    moyenne: moyenneMacros(totaux.map((t) => t.total)),
    cibles: aujourdhui ? { kcal: aujourdhui.kcal, ...aujourdhui.macros } : null,
    pesees: pesees.toReversed(),
    poidsCibleKg: o && o.sens !== "maintenir" ? o.poidsCibleKg : null,
  };
}
