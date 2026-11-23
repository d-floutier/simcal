import Link from "next/link";
import { CourbePoids, GraphiqueKcal, MoyenneMacros } from "@/components/statistiques";
import { buttonVariants } from "@/components/ui/button";
import { requireProfil } from "@/lib/profil";
import { statistiques, type PeriodeStatistiques } from "@/services";
import { formaterJourCourt, textes } from "@/ui/textes";

const t = textes.statistiques;
const PERIODES: PeriodeStatistiques[] = [7, 30];

export default async function StatistiquesPage({ searchParams }: PageProps<"/statistiques">) {
  const { ctx } = await requireProfil();
  const { periode } = await searchParams;
  const jours: PeriodeStatistiques = periode === "30" ? 30 : 7;
  const stats = await statistiques(ctx, { jours });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
          ← {textes.navigation.journal}
        </Link>
        <h1 className="text-2xl font-semibold">{t.titre}</h1>
        <p className="text-sm text-muted-foreground">
          {t.intervalle(formaterJourCourt(stats.du), formaterJourCourt(stats.au))}
        </p>
      </div>

      <nav aria-label={t.periodes} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {PERIODES.map((p) => (
          <Link
            key={p}
            href={`/statistiques?periode=${p}`}
            aria-current={p === jours ? "page" : undefined}
            className={buttonVariants({
              variant: p === jours ? "outline" : "ghost",
              size: "sm",
              className: p === jours ? "bg-background" : "",
            })}
          >
            {t.periode(p)}
          </Link>
        ))}
      </nav>

      <GraphiqueKcal stats={stats} />
      <MoyenneMacros stats={stats} />
      <CourbePoids stats={stats} />
    </div>
  );
}
