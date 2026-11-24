import Link from "next/link";
import { BoutonSupprimerPesee, FormulairePesee, PropositionMaintien } from "@/components/pesees";
import { buttonVariants } from "@/components/ui/button";
import { ecartPoidsCible, jourCalendaire } from "@/core";
import { requireProfil } from "@/lib/profil";
import { listerPesees, propositionMaintien } from "@/services";
import { formaterJourLong, formaterKg, textes } from "@/ui/textes";

const t = textes.pesees;

export default async function PeseesPage({ searchParams }: PageProps<"/pesees">) {
  const { ctx, profil } = await requireProfil();
  const aujourdhui = jourCalendaire(new Date(), profil.fuseau);
  const [pesees, proposer] = await Promise.all([listerPesees(ctx), propositionMaintien(ctx)]);
  const { jour } = await searchParams;
  const aModifier = pesees.find((p) => p.jour === jour);
  const ecart = ecartPoidsCible(profil.objectif, profil.poidsKg);
  const o = profil.objectif;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
          ← {textes.navigation.journal}
        </Link>
        <h1 className="text-2xl font-semibold">{t.titre}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <section
        aria-labelledby="poids-cible"
        className="flex flex-col gap-2 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10"
      >
        <h2 id="poids-cible" className="sr-only">
          {t.poidsCible}
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{t.poidsActuel}</dt>
          <dd className="text-right font-semibold tabular-nums">{formaterKg(profil.poidsKg)}</dd>
          {o.sens !== "maintenir" && (
            <>
              <dt className="text-muted-foreground">{t.poidsCible}</dt>
              <dd className="text-right tabular-nums">{formaterKg(o.poidsCibleKg)}</dd>
            </>
          )}
        </dl>
        {ecart !== null && (
          <p className="text-base font-medium">
            {ecart === 0
              ? t.cibleAtteinte
              : o.sens === "perdre"
                ? t.resteAPerdre(formaterKg(ecart))
                : t.resteAPrendre(formaterKg(ecart))}
          </p>
        )}
      </section>

      {proposer && <PropositionMaintien />}

      <FormulairePesee key={aModifier?.jour ?? "nouvelle"} aujourdhui={aujourdhui} pesee={aModifier} />

      <section aria-labelledby="pesees-precedentes" className="flex flex-col gap-2">
        <h2 id="pesees-precedentes" className="text-base font-semibold">
          {t.precedentes}
        </h2>
        {pesees.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.aucune}</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
            {pesees.map((p) => {
              const date = formaterJourLong(p.jour);
              return (
                <li key={p.jour} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-4 py-2 text-sm">
                  <span className="first-letter:uppercase">{date}</span>
                  <span className="font-medium tabular-nums">{formaterKg(p.poidsKg)}</span>
                  <Link
                    href={`/pesees?jour=${p.jour}`}
                    aria-label={t.modifierLibelle(date)}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {t.modifier}
                  </Link>
                  {pesees.length > 1 ? (
                    <BoutonSupprimerPesee jour={p.jour} libelle={t.supprimerLibelle(date)} />
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {pesees.length === 1 && <p className="text-sm text-muted-foreground">{t.derniereNonSupprimable}</p>}
      </section>
    </div>
  );
}
