import Link from "next/link";
import { FormulaireEntree } from "@/components/formulaire-entree";
import { buttonVariants } from "@/components/ui/button";
import { requireProfil } from "@/lib/profil";
import { lireEntree } from "@/services";
import { formaterJourCourt, textes } from "@/ui/textes";

export default async function EntreePage(props: PageProps<"/entrees/[id]">) {
  const { ctx } = await requireProfil();
  const { id } = await props.params;
  const entree = await lireEntree(ctx, id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={entree ? `/?jour=${entree.jour}` : "/"}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}
      >
        ← {textes.navigation.journal}
      </Link>
      {!entree ? (
        <p role="alert">{textes.entree.introuvable}</p>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-semibold">{entree.nom}</h1>
            {entree.marque && <p className="text-sm text-muted-foreground">{entree.marque}</p>}
            <p className="text-sm text-muted-foreground">{formaterJourCourt(entree.jour)}</p>
          </div>
          {entree.alimentId === null && <p className="text-sm text-muted-foreground">{textes.entree.alimentSupprime}</p>}
          <section
            aria-labelledby="modifier"
            className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <h2 id="modifier" className="text-base font-semibold">
              {textes.entree.sectionModification}
            </h2>
            <FormulaireEntree
              mode="modification"
              entreeId={entree.id}
              repas={entree.repas}
              quantite={entree.quantite}
              pour100g={entree.pour100g}
              uniteParDefaut={entree.quantite.unite}
            />
          </section>
        </>
      )}
    </div>
  );
}
