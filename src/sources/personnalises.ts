import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { aliment } from "@/db/schema";
import { chercherEnBase } from "./ciqual";
import type { AlimentResume, SourceAliments } from "./source";

/** La source des Aliments personnalisés : ceux de `userId` seulement, qui leur sont privés. */
export function sourcePersonnalises(db: Db, userId: string): SourceAliments {
  const aLui = and(eq(aliment.type, "personnalise"), eq(aliment.proprietaireId, userId));
  return {
    chercher: (texte) => chercherEnBase(db, texte, aLui),
    async trouverParCodeBarres(code) {
      const [a]: AlimentResume[] = await db
        .select({
          id: aliment.id,
          type: aliment.type,
          nom: aliment.nom,
          marque: aliment.marque,
          kcal: aliment.kcal,
          unite: aliment.unite,
        })
        .from(aliment)
        .where(and(aLui, eq(aliment.codeBarres, code)))
        .orderBy(aliment.nomRecherche)
        .limit(1);
      return a ?? null;
    },
  };
}
