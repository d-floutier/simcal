import { requireContexte } from "@/lib/profil";
import { exporterDonnees } from "@/services";

/** Télécharge l'export JSON de toutes les données de l'utilisateur connecté. */
export async function GET() {
  const ctx = await requireContexte();
  const donnees = await exporterDonnees(ctx);
  const jour = donnees.exporteLe.slice(0, 10);
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="simcal-export-${jour}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
