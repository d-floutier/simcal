import Link from "next/link";
import { BoutonSupprimerAliment, FormulaireAliment } from "@/components/formulaire-aliment";
import { PortionsAliment } from "@/components/portions-aliment";
import { buttonVariants } from "@/components/ui/button";
import { requireProfil } from "@/lib/profil";
import { lireAliment } from "@/services";
import { textes } from "@/ui/textes";

const t = textes.personnalises;

export default async function AlimentPersonnalisePage(props: PageProps<"/mes-aliments/[id]">) {
  const { ctx } = await requireProfil();
  const { id } = await props.params;
  const fiche = await lireAliment(ctx, id);
  const aliment = fiche?.type === "personnalise" ? fiche : null;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/mes-aliments" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
        ← {t.titre}
      </Link>
      {!aliment ? (
        <p role="alert">{t.introuvable}</p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">{aliment.nom}</h1>
          <section
            aria-labelledby="portions"
            className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div>
              <h2 id="portions" className="text-base font-semibold">
                {t.portions}
              </h2>
              <p className="text-sm text-muted-foreground">{t.portionsIntro}</p>
            </div>
            <PortionsAliment alimentId={aliment.id} unite={aliment.unite} portions={aliment.portions} />
          </section>
          <section
            aria-labelledby="modification"
            className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <h2 id="modification" className="text-base font-semibold">
              {t.modification}
            </h2>
            <FormulaireAliment aliment={aliment} />
          </section>
          <BoutonSupprimerAliment alimentId={aliment.id} />
        </>
      )}
    </div>
  );
}
