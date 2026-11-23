import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { textes } from "@/ui/textes";
import { seDeconnecter } from "../(public)/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-primary">{textes.app.nom}</span>
          <nav className="flex items-center gap-1">
            <Link href="/pesees" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {textes.navigation.pesees}
            </Link>
            <Link href="/statistiques" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {textes.navigation.statistiques}
            </Link>
            <form action={seDeconnecter}>
              <Button type="submit" variant="ghost" size="sm">
                {textes.navigation.deconnexion}
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
