import { textes } from "@/ui/textes";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <p className="text-3xl font-bold tracking-tight text-primary">{textes.app.nom}</p>
        <p className="mt-1 text-sm text-muted-foreground">{textes.app.description}</p>
      </div>
      {children}
    </main>
  );
}
