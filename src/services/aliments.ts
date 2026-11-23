import { and, eq, isNull, ne, or } from "drizzle-orm";
import type { ValeursNutritionnelles } from "@/core";
import { aliment, type TypeAliment, type UniteAliment } from "@/db/schema";
import { sourceCiqual } from "@/sources/ciqual";
import type { AlimentResume, SourceAliments } from "@/sources/source";
import type { Contexte } from "./contexte";

export type { AlimentResume, SourceAliments };

/** La fiche d'un Aliment : ses valeurs pour 100 g (ou 100 ml), nutriments facultatifs compris. */
export type FicheAliment = {
  id: string;
  type: TypeAliment;
  nom: string;
  marque: string | null;
  unite: UniteAliment;
  valeurs: ValeursNutritionnelles;
};

/** Les sources, dans l'ordre où leurs résultats sont présentés. */
export function sourcesParDefaut(ctx: Contexte): SourceAliments[] {
  return [sourceCiqual(ctx.db)];
}

/**
 * Cherche des Aliments dans chaque source, dans l'ordre des sources, sans doublons.
 * Une source en erreur est ignorée : les autres résultats s'affichent quand même.
 */
export async function chercherAliments(
  ctx: Contexte,
  texte: string,
  sources: SourceAliments[] = sourcesParDefaut(ctx),
): Promise<AlimentResume[]> {
  if (texte.trim() === "") return [];
  const parSource = await Promise.all(
    sources.map((s) =>
      s.chercher(texte).catch((e) => {
        console.error(e);
        return [] as AlimentResume[];
      }),
    ),
  );
  const vus = new Set<string>();
  return parSource.flat().filter((a) => !vus.has(a.id) && vus.add(a.id));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUuid = (id: string) => UUID.test(id);

/** Un Aliment visible par l'utilisateur : partagé, ou personnalisé et à lui. Null sinon. */
export async function lireAliment(ctx: Contexte, id: string): Promise<FicheAliment | null> {
  if (!estUuid(id)) return null;
  const [a] = await ctx.db
    .select()
    .from(aliment)
    .where(
      and(
        eq(aliment.id, id),
        or(ne(aliment.type, "personnalise"), eq(aliment.proprietaireId, ctx.userId)),
        or(isNull(aliment.proprietaireId), eq(aliment.proprietaireId, ctx.userId)),
      ),
    );
  if (!a) return null;
  return {
    id: a.id,
    type: a.type,
    nom: a.nom,
    marque: a.marque,
    unite: a.unite,
    valeurs: {
      kcal: a.kcal,
      proteines: a.proteines,
      glucides: a.glucides,
      lipides: a.lipides,
      fibres: a.fibres,
      sucres: a.sucres,
      satures: a.satures,
      sel: a.sel,
    },
  };
}
