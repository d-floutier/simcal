import Link from "next/link";
import { FormulaireAliment } from "@/components/formulaire-aliment";
import { buttonVariants } from "@/components/ui/button";
import { requireProfil } from "@/lib/profil";
import { textes } from "@/ui/textes";

export default async function NouvelAlimentPage(props: PageProps<"/mes-aliments/nouveau">) {
  await requireProfil();
  const { codeBarres } = await props.searchParams;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/mes-aliments" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 self-start" })}>
        ← {textes.personnalises.titre}
      </Link>
      <h1 className="text-2xl font-semibold">{textes.personnalises.nouveau}</h1>
      <FormulaireAliment codeBarres={typeof codeBarres === "string" ? codeBarres : undefined} />
    </div>
  );
}
