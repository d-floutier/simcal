// Graphiques des statistiques : HTML et CSS (plus un tracé SVG pour la courbe de poids), rendus
// côté serveur. Ils s'étirent à la largeur de l'écran sans déformer le texte ; chaque graphique
// a un résumé accessible et un tableau des valeurs.
import type { ReactNode } from "react";
import type { Statistiques } from "@/services";
import { formaterGrammes, formaterJourCourt, formaterKcal, formaterKg, formaterNombre, textes } from "@/ui/textes";

const t = textes.statistiques;

/** Des graduations rondes (pas de 1, 2 ou 5 × 10ⁿ) qui couvrent [min, max]. */
function graduations(min: number, max: number, cible = 4): number[] {
  const brut = (max - min) / cible || 1;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 5, 10].map((m) => m * puissance).find((p) => p >= brut)!;
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const ticks: number[] = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** Le libellé court d'un jour sur l'axe : « 23 nov. ». */
function jourAxe(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(a, m - 1, j)),
  );
}

function Carte({ id, titre, intro, children }: { id: string; titre: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-base font-semibold">
          {titre}
        </h2>
        {intro && <p className="text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Tableau({ entetes, lignes }: { entetes: string[]; lignes: string[][] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground">{t.voirTableau}</summary>
      <table className="mt-2 w-full tabular-nums">
        <thead>
          <tr className="text-left text-muted-foreground">
            {entetes.map((e, i) => (
              <th key={e} scope="col" className={`py-1 font-medium ${i > 0 ? "text-right" : ""}`}>
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map(([premiere, ...autres]) => (
            <tr key={premiere} className="border-t">
              <th scope="row" className="py-1 text-left font-normal">
                {premiere}
              </th>
              {autres.map((v, i) => (
                <td key={i} className="py-1 text-right">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Les libellés de l'axe horizontal : le premier jour, celui du milieu et le dernier. */
function AxeJours({ jours }: { jours: string[] }) {
  const n = jours.length;
  const reperes = n <= 7 ? jours.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
  return (
    <div aria-hidden className="relative h-4 text-xs text-muted-foreground">
      {reperes.map((i) => {
        // Sur 30 jours, les libellés des bords s'alignent sur les bords pour ne pas déborder.
        const bord = n > 7 && (i === 0 || i === n - 1);
        const align = !bord ? "-translate-x-1/2" : i === 0 ? "translate-x-0" : "-translate-x-full";
        const left = !bord ? `${((i + 0.5) / n) * 100}%` : i === 0 ? "0%" : "100%";
        return (
          <span key={i} className={`absolute top-0 whitespace-nowrap ${align}`} style={{ left }}>
            {n <= 7 ? jourAxe(jours[i]).replace(/\s.*$/, "") : jourAxe(jours[i])}
          </span>
        );
      })}
    </div>
  );
}

function Legende({ elements }: { elements: { cle: ReactNode; libelle: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {elements.map((e) => (
        <li key={e.libelle} className="flex items-center gap-1.5">
          {e.cle}
          {e.libelle}
        </li>
      ))}
    </ul>
  );
}

const CleBarre = () => <span aria-hidden className="size-2.5 rounded-sm bg-primary" />;
const CleLigne = () => <span aria-hidden className="h-0.5 w-3 rounded-full bg-foreground/70" />;
const ClePoint = () => <span aria-hidden className="size-2.5 rounded-full bg-primary" />;

/** Les kcal de chaque jour en colonnes, avec l'Objectif calorique de ce jour-là en trait. */
export function GraphiqueKcal({ stats }: { stats: Statistiques }) {
  const valeurs = stats.jours.flatMap((j) => [j.kcal ?? 0, j.objectifKcal ?? 0]);
  const ticks = graduations(0, Math.max(500, ...valeurs));
  const haut = ticks.at(-1)!;
  const pct = (v: number) => `${(v / haut) * 100}%`;
  const libelleKcal = (v: number | null) => (v === null ? t.sansEntree : formaterKcal(v));
  const libelleObjectif = (v: number | null) => (v === null ? t.sansObjectif : formaterKcal(v));

  return (
    <Carte id="stats-kcal" titre={t.kcalTitre} intro={t.kcalIntro}>
      <Legende
        elements={[
          { cle: <CleBarre />, libelle: t.consomme },
          { cle: <CleLigne />, libelle: t.objectif },
        ]}
      />
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <div aria-hidden className="relative h-44 w-10 text-right text-xs text-muted-foreground tabular-nums">
          {ticks.map((v) => (
            <span key={v} className="absolute right-0 translate-y-1/2" style={{ bottom: pct(v) }}>
              {formaterNombre(v)}
            </span>
          ))}
        </div>
        <div
          role="img"
          aria-label={t.resumeKcal(stats.joursAvecEntree, stats.jours.length)}
          className="relative h-44"
        >
          {ticks.map((v) => (
            <div key={v} aria-hidden className="absolute inset-x-0 border-t border-border" style={{ bottom: pct(v) }} />
          ))}
          <div className="absolute inset-0 flex">
            {stats.jours.map((j) => (
              <div
                key={j.jour}
                data-jour={j.jour}
                data-vide={j.kcal === null ? "" : undefined}
                title={t.infobulleJour(formaterJourCourt(j.jour), libelleKcal(j.kcal), libelleObjectif(j.objectifKcal))}
                className="group relative h-full flex-1 px-px hover:bg-muted/60"
              >
                {j.kcal !== null && j.kcal > 0 && (
                  <div
                    className="absolute bottom-0 left-1/2 w-[calc(100%-2px)] max-w-6 -translate-x-1/2 rounded-t bg-primary"
                    style={{ height: pct(j.kcal) }}
                  />
                )}
                {j.objectifKcal !== null && (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 h-0.5 translate-y-1/2 bg-foreground/70"
                    style={{ bottom: pct(j.objectifKcal) }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <span />
        <AxeJours jours={stats.jours.map((j) => j.jour)} />
      </div>
      <Tableau
        entetes={[t.jour, t.consomme, t.objectif]}
        lignes={stats.jours.map((j) => [
          formaterJourCourt(j.jour),
          j.kcal === null ? "—" : formaterKcal(j.kcal),
          j.objectifKcal === null ? "—" : formaterKcal(j.objectifKcal),
        ])}
      />
    </Carte>
  );
}

const MACROS = [
  { cle: "kcal", libelle: t.kcal, format: formaterKcal },
  { cle: "glucides", libelle: t.glucides, format: formaterGrammes },
  { cle: "proteines", libelle: t.proteines, format: formaterGrammes },
  { cle: "lipides", libelle: t.lipides, format: formaterGrammes },
] as const;

/** La moyenne des Macros des jours avec Entrée, chacune face à sa cible. */
export function MoyenneMacros({ stats }: { stats: Statistiques }) {
  const { moyenne, cibles } = stats;
  return (
    <Carte id="stats-macros" titre={t.macrosTitre} intro={t.macrosIntro(stats.joursAvecEntree)}>
      {moyenne && (
        <ul className="flex flex-col gap-3">
          {MACROS.map(({ cle, libelle, format }) => {
            const m = moyenne[cle];
            const c = cibles?.[cle] ?? null;
            const echelle = Math.max(m, c ?? 0) || 1;
            return (
              <li key={cle} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{libelle}</span>
                  <span className="tabular-nums">
                    {format(m)}
                    {c !== null && <span className="text-muted-foreground"> / {format(c)}</span>}
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${libelle} : ${t.moyenne.toLowerCase()} ${format(m)}${c !== null ? `, ${t.cible.toLowerCase()} ${format(c)}` : ""}`}
                  className="relative h-2 rounded-full bg-primary/15"
                >
                  <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(m / echelle) * 100}%` }} />
                  {c !== null && (
                    <div
                      aria-hidden
                      className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
                      style={{ left: `${(c / echelle) * 100}%` }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {moyenne && (
        <Legende
          elements={[
            { cle: <CleBarre />, libelle: t.moyenne },
            { cle: <span aria-hidden className="h-3 w-0.5 rounded-full bg-foreground/70" />, libelle: t.cible },
          ]}
        />
      )}
    </Carte>
  );
}

/** La courbe des Pesées de la période, avec le Poids cible en trait. */
export function CourbePoids({ stats }: { stats: Statistiques }) {
  const { pesees, poidsCibleKg } = stats;
  if (pesees.length === 0) {
    return (
      <Carte id="stats-poids" titre={t.poidsTitre} intro={t.aucunePesee}>
        {poidsCibleKg !== null && (
          <p>
            {t.poidsCible} : <span className="tabular-nums">{formaterKg(poidsCibleKg)}</span>
          </p>
        )}
      </Carte>
    );
  }

  const jours = stats.jours.map((j) => j.jour);
  const n = jours.length;
  const poids = pesees.map((p) => p.poidsKg).concat(poidsCibleKg ?? []);
  const ticks = graduations(Math.min(...poids) - 0.5, Math.max(...poids) + 0.5, 3);
  const bas = ticks[0];
  const haut = ticks.at(-1)!;
  const y = (kg: number) => ((haut - kg) / (haut - bas)) * 100;
  const x = (jour: string) => ((jours.indexOf(jour) + 0.5) / n) * 100;
  const points = pesees.map((p) => ({ ...p, x: x(p.jour), y: y(p.poidsKg) }));
  const premier = pesees[0];
  const dernier = pesees.at(-1)!;

  return (
    <Carte id="stats-poids" titre={t.poidsTitre}>
      <Legende
        elements={[
          { cle: <ClePoint />, libelle: t.pesee },
          ...(poidsCibleKg !== null ? [{ cle: <CleLigne />, libelle: t.poidsCible }] : []),
        ]}
      />
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
        <div aria-hidden className="relative h-40 w-10 text-right text-xs text-muted-foreground tabular-nums">
          {ticks.map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(v)}%` }}>
              {formaterNombre(v, 1)}
            </span>
          ))}
        </div>
        <div
          role="img"
          aria-label={`${t.resumePoids(pesees.length, formaterKg(premier.poidsKg), formaterKg(dernier.poidsKg))}${
            poidsCibleKg !== null ? ` ${t.poidsCible} : ${formaterKg(poidsCibleKg)}.` : ""
          }`}
          className="relative h-40"
        >
          {ticks.map((v) => (
            <div key={v} aria-hidden className="absolute inset-x-0 border-t border-border" style={{ top: `${y(v)}%` }} />
          ))}
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            {poidsCibleKg !== null && (
              <line
                x1={0}
                x2={100}
                y1={y(poidsCibleKg)}
                y2={y(poidsCibleKg)}
                className="stroke-foreground/70"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {points.map((p) => (
            <span
              key={p.jour}
              data-pesee={p.jour}
              title={`${formaterJourCourt(p.jour)} : ${formaterKg(p.poidsKg)}`}
              className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="size-2.5 rounded-full bg-primary ring-2 ring-card" />
            </span>
          ))}
        </div>
        <span />
        <AxeJours jours={jours} />
      </div>
      <Tableau
        entetes={[t.jour, t.pesee]}
        lignes={pesees.map((p) => [formaterJourCourt(p.jour), formaterKg(p.poidsKg)])}
      />
    </Carte>
  );
}
