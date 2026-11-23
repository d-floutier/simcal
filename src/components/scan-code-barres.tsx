"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff } from "lucide-react";
import { AlerteHorsLigne, useEnLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { textes } from "@/ui/textes";

const t = textes.scan;
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
const INTERVALLE_MS = 200;
/** Le WASM de zxing, servi par l'app (voir public/zxing_reader.wasm) : rien ne part vers un CDN. */
const WASM_ZXING = "/zxing_reader.wasm";

type Detecteur = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type EtatCamera = "arretee" | "demarrage" | "active" | "refusee" | "indisponible";

/** BarcodeDetector du navigateur s'il lit les EAN, sinon le ponyfill zxing (Safari, Firefox). */
async function creerDetecteur(): Promise<Detecteur> {
  type Natif = { new (o: { formats: string[] }): Detecteur; getSupportedFormats(): Promise<string[]> };
  const natif = (globalThis as { BarcodeDetector?: Natif }).BarcodeDetector;
  if (natif && (await natif.getSupportedFormats().catch((): string[] => [])).includes("ean_13")) {
    return new natif({ formats: FORMATS });
  }
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  prepareZXingModule({
    overrides: { locateFile: (chemin: string, prefixe: string) => (chemin.endsWith(".wasm") ? WASM_ZXING : prefixe + chemin) },
  });
  return new BarcodeDetector({ formats: FORMATS as never });
}

/**
 * Le scan d'un Code-barres : la caméra ne fait que lire le code ; la page `/scan` le cherche.
 * La saisie manuelle reste toujours possible, caméra refusée ou indisponible comprise.
 */
export function ScanCodeBarres({ jour, repas, code }: { jour: string; repas: string; code?: string }) {
  const router = useRouter();
  const garde = useGardeHorsLigne();
  const enLigne = useEnLigne();
  const [luHorsLigne, setLuHorsLigne] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const arret = useRef<() => void>(() => {});
  const [etat, setEtat] = useState<EtatCamera>("arretee");

  useEffect(() => () => arret.current(), []);

  function chercher(lu: string) {
    // Hors ligne, le code lu n'est pas envoyé : on le laisse dans le champ pour plus tard.
    if (!navigator.onLine) {
      setLuHorsLigne(true);
      const champ = document.getElementById("code") as HTMLInputElement | null;
      if (champ) champ.value = lu;
      return;
    }
    router.push(`/scan?${new URLSearchParams({ code: lu, jour, repas })}`);
  }

  async function demarrer() {
    if (!navigator.mediaDevices?.getUserMedia) return setEtat("indisponible");
    setEtat("demarrage");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      return setEtat(e instanceof DOMException && e.name === "NotAllowedError" ? "refusee" : "indisponible");
    }
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    let actif = true;
    arret.current = () => {
      actif = false;
      clearTimeout(minuteur);
      flux.getTracks().forEach((piste) => piste.stop());
    };
    try {
      const detecteur = await creerDetecteur();
      const v = video.current!;
      v.srcObject = flux;
      await v.play();
      setEtat("active");
      const lire = async () => {
        if (!actif) return;
        const [lu] = await detecteur.detect(v).catch(() => []);
        if (lu?.rawValue) {
          arret.current();
          setEtat("arretee");
          chercher(lu.rawValue);
        } else {
          minuteur = setTimeout(lire, INTERVALLE_MS);
        }
      };
      void lire();
    } catch (e) {
      console.error(e);
      arret.current();
      setEtat("indisponible");
    }
  }

  function arreter() {
    arret.current();
    setEtat("arretee");
  }

  const enMarche = etat === "demarrage" || etat === "active";

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <video
          ref={video}
          aria-label={t.video}
          playsInline
          muted
          className={enMarche ? "aspect-[4/3] w-full rounded-lg bg-black object-cover" : "hidden"}
        />
        {etat === "demarrage" && <p className="text-sm text-muted-foreground">{t.demarrage}</p>}
        {etat === "active" && <p className="text-sm text-muted-foreground">{t.viser}</p>}
        {(etat === "refusee" || etat === "indisponible") && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {etat === "refusee" ? t.refusee : t.indisponible}
          </p>
        )}
        {enMarche ? (
          <Button type="button" variant="outline" onClick={arreter} className="h-11">
            <CameraOff aria-hidden />
            {t.arreter}
          </Button>
        ) : (
          <Button type="button" onClick={demarrer} className="h-11">
            <Camera aria-hidden />
            {t.camera}
          </Button>
        )}
      </section>

      <form
        action="/scan"
        method="get"
        onSubmit={garde.onSubmit}
        className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
      >
        {(garde.saisieBloquee || (luHorsLigne && !enLigne)) && <AlerteHorsLigne />}
        <input type="hidden" name="jour" value={jour} />
        <input type="hidden" name="repas" value={repas} />
        <Label htmlFor="code">{t.champ}</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          required
          defaultValue={code}
          aria-describedby="code-aide"
          className="h-11 tabular-nums"
        />
        <p id="code-aide" className="text-xs text-muted-foreground">
          {t.aide}
        </p>
        <Button type="submit" variant="outline" className="h-11">
          {t.chercher}
        </Button>
      </form>
    </div>
  );
}
