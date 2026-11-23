import Link from "next/link";
import { ResumeObjectif } from "@/components/resume-objectif";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { jourCalendaire } from "@/core";
import { requireProfil } from "@/lib/profil";
import { lireJournal } from "@/services";
import { formaterJourLong, textes } from "@/ui/textes";

export default async function JournalPage() {
  const { ctx, profil } = await requireProfil();
  const jour = jourCalendaire(new Date(), profil.fuseau);
  const journal = await lireJournal(ctx, jour);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{textes.journal.titre}</h1>
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {textes.journal.aujourdhui} · {formaterJourLong(journal.jour)}
          </p>
        </div>
        <Link href="/reglages" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {textes.navigation.reglages}
        </Link>
      </div>
      <ResumeObjectif objectif={journal.objectif} titre={textes.journal.objectifDuJour} detail={false} />
      {journal.repas.map(({ repas }) => (
        <Card key={repas} size="sm" role="region" aria-labelledby={`repas-${repas}`}>
          <CardHeader>
            <h2 id={`repas-${repas}`} className="text-base font-medium">
              {textes.repas[repas]}
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{textes.journal.repasVide}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
