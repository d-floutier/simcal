import {
  ajouterEntree,
  ajouterPortion,
  ajouterVerre,
  chercherAliments,
  creerAlimentPersonnalise,
  enregistrerPesee,
  enregistrerProfil,
  modifierReglagesHydratation,
  type Contexte,
  type SaisieProfil,
} from "@/services";
import { sourceCiqual } from "@/sources/ciqual";

export const PROFIL_TEST: SaisieProfil = {
  sexe: "femme",
  dateNaissance: "1990-05-12",
  tailleCm: 165,
  poidsKg: 68,
  niveauActivite: "leger",
  fuseau: "Europe/Paris",
  objectif: { sens: "perdre", poidsCibleKg: 62, rythme: 0.5 },
  repartition: { glucides: 50, proteines: 20, lipides: 30 },
};

/** Midi à Paris, le jour donné. */
export const midi = (jour: string) => new Date(`${jour}T11:00:00Z`);

/**
 * Remplit chaque type de donnée personnelle pour l'utilisateur du contexte, par les services :
 * Profil, deux objectifs (dont l'Objectif d'hydratation), Entrées (Aliment générique et Aliment
 * personnalisé en Portion), Pesée, ajouts d'Hydratation, Aliment personnalisé et sa Portion.
 * Les Aliments génériques de test doivent être importés.
 */
export async function remplirDonneesPersonnelles(ctx: Contexte, nomAliment = "Soupe maison") {
  await enregistrerProfil(ctx, PROFIL_TEST, midi("2026-11-20"));
  await modifierReglagesHydratation(ctx, { objectifMl: 2500, verreMl: 300 }, midi("2026-11-22"));
  const soupe = await creerAlimentPersonnalise(ctx, {
    nom: nomAliment,
    unite: "g",
    codeBarres: "12345670",
    valeurs: { kcal: 40, proteines: 1.5, glucides: 6, lipides: 1 },
  });
  const bol = await ajouterPortion(ctx, soupe.id, { nom: "1 bol", grammes: 300 });
  // Seulement CIQUAL : la recherche ne remplit pas le cache partagé d'Open Food Facts.
  const [pomme] = await chercherAliments(ctx, "pomme crue", [sourceCiqual(ctx.db)]);
  const entreePomme = await ajouterEntree(
    ctx,
    { jour: "2026-11-22", repas: "dejeuner", alimentId: pomme.id, quantite: { unite: "g", valeur: 150 } },
    midi("2026-11-22"),
  );
  const entreeSoupe = await ajouterEntree(
    ctx,
    { jour: "2026-11-22", repas: "diner", alimentId: soupe.id, quantite: { unite: "portion", portionId: bol.id, nombre: 2 } },
    midi("2026-11-22"),
  );
  await enregistrerPesee(ctx, { jour: "2026-11-21", poidsKg: 67.4 }, midi("2026-11-22"));
  await ajouterVerre(ctx, "2026-11-22", midi("2026-11-22"));
  await ajouterVerre(ctx, "2026-11-22", midi("2026-11-22"));
  return { soupe, bol, pomme, entreePomme, entreeSoupe };
}
