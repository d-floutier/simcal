import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ResumeJournal } from "@/components/resume-journal";
import { SuiviHydratation } from "@/components/hydratation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { jourDecale } from "@/core";
import { jourDemande } from "@/lib/jour-demande";
import { requireProfil } from "@/lib/profil";
import { lireHydratation, lireJournal } from "@/services";
import { formaterJourLong, formaterKcal, formaterQuantite, textes } from "@/ui/textes";

const t = textes.journal;

export default async function JournalPage(props: PageProps<"/">) {
  const { ctx, profil } = await requireProfil();
  // Un jour futur ou illisible ramène à aujourd'hui : on ne note pas dans le futur.
  const { jour, aujourdhui } = jourDemande((await props.searchParams).jour, profil.fuseau);
  const [journal, hydratation] = await Promise.all([lireJournal(ctx, jour), lireHydratation(ctx, jour)]);
  const estAujourdhui = jour === aujourdhui;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.titre}</h1>
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {estAujourdhui ? `${t.aujourdhui} · ` : ""}
            {formaterJourLong(jour)}
          </p>
        </div>
        <Link href="/reglages" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {textes.navigation.reglages}
        </Link>
      </div>

      <nav aria-label="Jours" className="flex items-center justify-between gap-2">
        <Link
          href={`/?jour=${jourDecale(jour, -1)}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          aria-label={t.jourPrecedent}
        >
          <ChevronLeft aria-hidden /> {t.jourPrecedent}
        </Link>
        {!estAujourdhui && (
          <Link href="/" className={buttonVariants({ variant: "link", size: "sm" })}>
            {t.retourAujourdhui}
          </Link>
        )}
        {estAujourdhui ? (
          <span aria-hidden className="w-24" />
        ) : (
          <Link
            href={`/?jour=${jourDecale(jour, 1)}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            aria-label={t.jourSuivant}
          >
            {t.jourSuivant} <ChevronRight aria-hidden />
          </Link>
        )}
      </nav>

      <ResumeJournal titre={t.objectifDuJour} total={journal.total} objectif={journal.objectif} reste={journal.reste} />

      <SuiviHydratation key={jour} hydratation={hydratation} />

      {journal.repas.map(({ repas, entrees, total }) => (
        <Card key={repas} size="sm" role="region" aria-labelledby={`repas-${repas}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <h2 id={`repas-${repas}`} className="text-base font-medium">
              {textes.repas[repas]}
            </h2>
            <span className="text-sm tabular-nums text-muted-foreground" aria-label={t.totalRepas(textes.repas[repas])}>
              {formaterKcal(total.kcal)}
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {entrees.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.repasVide}</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {entrees.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/entrees/${e.id}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{e.nom}</span>
                        <span className="text-xs text-muted-foreground">
                          {formaterQuantite(e.quantite.valeur, e.quantite.unite)}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formaterKcal(e.valeurs.kcal)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/ajouter?jour=${jour}&repas=${repas}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
              aria-label={t.ajouterA[repas]}
            >
              <Plus aria-hidden /> {t.ajouter}
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
