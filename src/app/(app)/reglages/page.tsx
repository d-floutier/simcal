import Link from "next/link";
import { FormulaireHydratation } from "@/components/hydratation";
import { FormulaireProfil } from "@/components/formulaire-profil";
import { buttonVariants } from "@/components/ui/button";
import { FUSEAU_PAR_DEFAUT, listeFuseaux } from "@/lib/fuseaux";
import { requireProfil } from "@/lib/profil";
import { lireReglagesHydratation } from "@/services";
import { textes } from "@/ui/textes";

export default async function ReglagesPage() {
  const { ctx, profil } = await requireProfil();
  const reglagesHydratation = await lireReglagesHydratation(ctx);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
          ← {textes.navigation.journal}
        </Link>
        <h1 className="text-2xl font-semibold">{textes.reglages.titre}</h1>
        <p className="text-sm text-muted-foreground">{textes.reglages.intro}</p>
      </div>
      <FormulaireProfil profil={profil} fuseaux={listeFuseaux()} fuseauParDefaut={FUSEAU_PAR_DEFAUT} />
      <hr />
      <FormulaireHydratation reglages={reglagesHydratation} />
    </div>
  );
}
