import Link from "next/link";
import { ChampRecherche } from "@/components/champ-recherche";
import { CreditCiqual } from "@/components/credit-ciqual";
import { buttonVariants } from "@/components/ui/button";
import { jourDemande, repasDemande } from "@/lib/jour-demande";
import { requireProfil } from "@/lib/profil";
import { chercherAliments, lireRecents } from "@/services";
import { formaterJourCourt, formaterKcal, formaterQuantiteEntree, textes } from "@/ui/textes";

const t = textes.recherche;

export default async function AjouterPage(props: PageProps<"/ajouter">) {
  const { ctx, profil } = await requireProfil();
  const params = await props.searchParams;
  const { jour } = jourDemande(params.jour, profil.fuseau);
  const repas = repasDemande(params.repas);
  const q = typeof params.q === "string" ? params.q : "";
  const resultats = q.trim() ? await chercherAliments(ctx, q) : [];
  const recents = q.trim() ? [] : await lireRecents(ctx);
  const suite = `jour=${jour}&repas=${repas}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Link
          href={`/?jour=${jour}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
        >
          ← {textes.navigation.journal}
        </Link>
        <h1 className="text-2xl font-semibold">{t.titre}</h1>
        <p className="text-sm text-muted-foreground">{t.pour(textes.repas[repas], formaterJourCourt(jour))}</p>
      </div>

      <ChampRecherche valeurInitiale={q} />

      {q.trim() !== "" && (
        <section aria-label={t.resultats}>
          {resultats.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.aucunResultat}</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
              {resultats.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/aliments/${a.id}?${suite}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block">{a.nom}</span>
                      {a.marque && <span className="text-xs text-muted-foreground">{a.marque}</span>}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {t.kcalPour100(formaterKcal(a.kcal), a.unite)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {q.trim() === "" && (
        <section aria-labelledby="recents" className="flex flex-col gap-2">
          <h2 id="recents" className="text-base font-semibold">
            {t.recents}
          </h2>
          {recents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.aucunRecent}</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
              {recents.map(({ aliment: a, quantite }) => (
                <li key={a.id}>
                  <Link
                    href={`/aliments/${a.id}?${suite}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block">{a.nom}</span>
                      {a.marque && <span className="text-xs text-muted-foreground">{a.marque}</span>}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formaterQuantiteEntree(quantite)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <CreditCiqual />
    </div>
  );
}
