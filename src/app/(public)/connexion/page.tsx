import Link from "next/link";
import { redirect } from "next/navigation";
import { FormulaireIdentifiants } from "@/components/formulaire-identifiants";
import { getSession } from "@/lib/auth";
import { textes } from "@/ui/textes";
import { seConnecter } from "../actions";

export default async function ConnexionPage() {
  if (await getSession()) redirect("/");
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{textes.connexion.titre}</h1>
      <FormulaireIdentifiants
        action={seConnecter}
        bouton={textes.connexion.bouton}
        enCours={textes.connexion.enCours}
        autocompleteMotDePasse="current-password"
      />
      <p className="text-center text-sm text-muted-foreground">
        {textes.connexion.pasDeCompte}{" "}
        <Link href="/inscription" className="font-medium text-primary underline-offset-4 hover:underline">
          {textes.connexion.lienInscription}
        </Link>
      </p>
    </section>
  );
}
