import { redirect } from "next/navigation";
import { FormulaireProfil } from "@/components/formulaire-profil";
import { FUSEAU_PAR_DEFAUT, listeFuseaux } from "@/lib/fuseaux";
import { requireContexte } from "@/lib/profil";
import { lireProfil } from "@/services";
import { textes } from "@/ui/textes";

export default async function ConfigurationPage() {
  const ctx = await requireContexte();
  if (await lireProfil(ctx)) redirect("/");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{textes.configuration.titre}</h1>
        <p className="text-sm text-muted-foreground">{textes.configuration.intro}</p>
      </div>
      <FormulaireProfil
        profil={null}
        fuseaux={listeFuseaux()}
        fuseauParDefaut={FUSEAU_PAR_DEFAUT}
        apres="journal"
      />
    </div>
  );
}
