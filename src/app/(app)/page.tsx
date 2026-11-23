import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { jourCalendaire } from "@/core";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { FUSEAU_PAR_DEFAUT } from "@/lib/fuseau";
import { lireJournal } from "@/services";
import { formaterJourLong, textes } from "@/ui/textes";

export default async function JournalPage() {
  const user = await requireUser();
  const jour = jourCalendaire(new Date(), FUSEAU_PAR_DEFAUT);
  const journal = await lireJournal({ db: getDb(), userId: user.id }, jour);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{textes.journal.titre}</h1>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {textes.journal.aujourdhui} · {formaterJourLong(journal.jour)}
        </p>
      </div>
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
