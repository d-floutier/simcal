import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { IndicateurHorsLigne } from "@/components/hors-ligne";
import { COULEUR_THEME } from "@/ui/pwa";
import { textes } from "@/ui/textes";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: textes.app.nom,
  description: textes.app.description,
  appleWebApp: { capable: true, title: textes.app.nom, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: COULEUR_THEME,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Pas de cache à la navigation ni de rechargement au retour du réseau :
            les pages contiennent des données personnelles et une saisie en cours serait perdue. */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          cacheOnNavigation={false}
          reloadOnOnline={false}
        >
          <IndicateurHorsLigne />
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
