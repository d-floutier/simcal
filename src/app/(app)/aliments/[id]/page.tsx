import Link from "next/link";
import { CreditCiqual } from "@/components/credit-ciqual";
import { FormulaireEntree } from "@/components/formulaire-entree";
import { TableauNutriments } from "@/components/tableau-nutriments";
import { buttonVariants } from "@/components/ui/button";
import { jourDemande, repasDemande } from "@/lib/jour-demande";
import { requireProfil } from "@/lib/profil";
import { lireAliment } from "@/services";
import { formaterJourCourt, textes } from "@/ui/textes";

export default async function AlimentPage(props: PageProps<"/aliments/[id]">) {
  const { ctx, profil } = await requireProfil();
  const { id } = await props.params;
  const params = await props.searchParams;
  const { jour } = jourDemande(params.jour, profil.fuseau);
  const repas = repasDemande(params.repas);
  const aliment = await lireAliment(ctx, id);
  const retour = `/ajouter?jour=${jour}&repas=${repas}`;

  return (
    <div className="flex flex-col gap-4">
      <Link href={retour} className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
        ← {textes.recherche.titre}
      </Link>
      {!aliment ? (
        <p role="alert">{textes.aliment.introuvable}</p>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-semibold">{aliment.nom}</h1>
            {aliment.marque && <p className="text-sm text-muted-foreground">{aliment.marque}</p>}
          </div>
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <TableauNutriments valeurs={aliment.valeurs} titre={textes.aliment.pour100(aliment.unite)} />
          </section>
          <section aria-labelledby="noter" className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 id="noter" className="text-base font-semibold">
              {textes.entree.sectionAjout}
              <span className="block text-sm font-normal text-muted-foreground">{formaterJourCourt(jour)}</span>
            </h2>
            <FormulaireEntree
              mode="ajout"
              alimentId={aliment.id}
              jour={jour}
              repas={repas}
              pour100g={aliment.valeurs}
              uniteParDefaut={aliment.unite}
            />
          </section>
          {aliment.type === "generique" && <CreditCiqual />}
        </>
      )}
    </div>
  );
}
