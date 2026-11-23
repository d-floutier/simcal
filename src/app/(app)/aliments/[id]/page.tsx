import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCiqual, CreditOpenFoodFacts } from "@/components/credit-ciqual";
import { FormulaireEntree } from "@/components/formulaire-entree";
import { TableauNutriments } from "@/components/tableau-nutriments";
import { buttonVariants } from "@/components/ui/button";
import { jourDemande, repasDemande } from "@/lib/jour-demande";
import { requireProfil } from "@/lib/profil";
import { garderProduit, lireAliment, lireRecents } from "@/services";
import { formaterJourCourt, textes } from "@/ui/textes";

export default async function AlimentPage(props: PageProps<"/aliments/[id]">) {
  const { ctx, profil } = await requireProfil();
  const { id } = await props.params;
  const params = await props.searchParams;
  const { jour } = jourDemande(params.jour, profil.fuseau);
  const repas = repasDemande(params.repas);
  // Un Produit d'Open Food Facts ouvert pour être noté est d'abord gardé en base.
  if (id.startsWith("off-")) {
    const produit = await garderProduit(ctx, id);
    if (produit) redirect(`/aliments/${produit.id}?jour=${jour}&repas=${repas}`);
  }
  const aliment = await lireAliment(ctx, id);
  // Un Récent s'ouvre avec la dernière quantité notée pour cet Aliment.
  const recent = aliment && (await lireRecents(ctx)).find((r) => r.aliment.id === aliment.id);
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
          {aliment.portions.length > 0 && (
            <section aria-labelledby="portions" className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 id="portions" className="pb-2 text-sm font-medium">
                {textes.aliment.portions}
              </h2>
              <ul className="flex flex-col gap-1 text-sm">
                {aliment.portions.map((p) => (
                  <li key={p.id}>{textes.aliment.portion(p.nom, p.grammes, aliment.unite)}</li>
                ))}
              </ul>
            </section>
          )}
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
              portions={aliment.portions}
              quantite={recent ? recent.quantite : undefined}
            />
          </section>
          {aliment.type === "generique" && <CreditCiqual />}
          {aliment.type === "produit" && <CreditOpenFoodFacts />}
          {aliment.type === "personnalise" && (
            <Link
              href={`/mes-aliments/${aliment.id}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "self-start" })}
            >
              {textes.aliment.modifierPersonnalise}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
