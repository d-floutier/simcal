import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireProfil } from "@/lib/profil";
import { listerAlimentsPersonnalises } from "@/services";
import { formaterKcal, textes } from "@/ui/textes";

const t = textes.personnalises;

export default async function MesAlimentsPage() {
  const { ctx } = await requireProfil();
  const aliments = await listerAlimentsPersonnalises(ctx);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t.titre}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <Link href="/mes-aliments/nouveau" className={buttonVariants({ size: "lg", className: "h-10 self-start" })}>
        {t.creer}
      </Link>
      {aliments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.aucun}</p>
      ) : (
        <ul aria-label={t.titre} className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {aliments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/mes-aliments/${a.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block">{a.nom}</span>
                  {a.portions.length > 0 && (
                    <span className="text-xs text-muted-foreground">{a.portions.map((p) => p.nom).join(" · ")}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {textes.recherche.kcalPour100(formaterKcal(a.valeurs.kcal), a.unite)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
