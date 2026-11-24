import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditOpenFoodFacts } from "@/components/credit-ciqual";
import { ScanCodeBarres } from "@/components/scan-code-barres";
import { buttonVariants } from "@/components/ui/button";
import { jourDemande, repasDemande } from "@/lib/jour-demande";
import { requireProfil } from "@/lib/profil";
import { trouverParCodeBarres } from "@/services";
import { formaterJourCourt, textes } from "@/ui/textes";

const t = textes.scan;

/** Le scan d'un Code-barres : `?code=` le cherche, et un code reconnu ouvre la saisie de quantité. */
export default async function ScanPage(props: PageProps<"/scan">) {
  const { ctx, profil } = await requireProfil();
  const params = await props.searchParams;
  const { jour } = jourDemande(params.jour, profil.fuseau);
  const repas = repasDemande(params.repas);
  const code = typeof params.code === "string" && params.code.trim() !== "" ? params.code.trim() : null;
  const resultat = code ? await trouverParCodeBarres(ctx, code) : null;
  if (resultat?.trouve) redirect(`/aliments/${resultat.aliment.id}?jour=${jour}&repas=${repas}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          href={`/ajouter?jour=${jour}&repas=${repas}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
        >
          ← {textes.recherche.titre}
        </Link>
        <h1 className="text-2xl font-semibold">{t.titre}</h1>
        <p className="text-sm text-muted-foreground">{textes.recherche.pour(textes.repas[repas], formaterJourCourt(jour))}</p>
      </div>

      {resultat && !resultat.trouve && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <p>
            {resultat.invalide
              ? t.invalide
              : resultat.horsService
                ? t.horsService(resultat.code)
                : t.introuvable(resultat.code)}
          </p>
          {!resultat.invalide && (
            <Link
              href={`/mes-aliments/nouveau?${new URLSearchParams({ codeBarres: resultat.code })}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
            >
              {t.creer}
            </Link>
          )}
        </div>
      )}

      <ScanCodeBarres key={code ?? ""} jour={jour} repas={repas} code={code ?? undefined} />
      <CreditOpenFoodFacts />
    </div>
  );
}
