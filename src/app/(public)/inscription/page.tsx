import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireIdentifiants } from "@/components/formulaire-identifiants";
import { getSession } from "@/lib/auth";
import { textes } from "@/ui/textes";
import { creerCompte } from "../actions";

export default async function InscriptionPage() {
  if (await getSession()) redirect("/");
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{textes.inscription.titre}</h1>
      <FormulaireIdentifiants
        action={creerCompte}
        bouton={textes.inscription.bouton}
        enCours={textes.inscription.enCours}
        aideMotDePasse={textes.inscription.aideMotDePasse}
        autocompleteMotDePasse="new-password"
      />
      <p className="text-center text-sm text-muted-foreground">
        {textes.inscription.dejaUnCompte}{" "}
        <Link href="/connexion" className="font-medium text-primary underline-offset-4 hover:underline">
          {textes.inscription.lienConnexion}
        </Link>
      </p>
    </section>
  );
}
