"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  calculerObjectif,
  jourCalendaire,
  NIVEAUX_ACTIVITE,
  REPARTITION_PAR_DEFAUT,
  RYTHMES,
  SENS_OBJECTIF,
  totalRepartition,
  type ObjectifCalcule,
  type ParametresObjectif,
  type Repartition,
  type Rythme,
} from "@/core";
import type { ChampProfil, SaisieProfil } from "@/services";
import { enregistrerProfilAction } from "@/app/(app)/actions-profil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlerteHorsLigne, useGardeHorsLigne } from "@/components/hors-ligne";
import { ResumeObjectif } from "@/components/resume-objectif";
import { lireNombreSaisi as nombre } from "@/lib/nombre-saisi";
import { textes } from "@/ui/textes";

const t = textes.profil;
const MACROS = ["glucides", "proteines", "lipides"] as const satisfies (keyof Repartition)[];

type Valeurs = {
  sexe: string;
  dateNaissance: string;
  tailleCm: string;
  poidsKg: string;
  niveauActivite: string;
  fuseau: string;
  sens: string;
  poidsCibleKg: string;
  rythme: string;
} & Record<keyof Repartition, string>;

function valeursInitiales(profil: SaisieProfil | null, fuseauParDefaut: string): Valeurs {
  const r = profil?.repartition ?? REPARTITION_PAR_DEFAUT;
  const o = profil?.objectif;
  return {
    sexe: profil?.sexe ?? "",
    dateNaissance: profil?.dateNaissance ?? "",
    tailleCm: profil ? String(profil.tailleCm) : "",
    poidsKg: profil ? String(profil.poidsKg) : "",
    niveauActivite: profil?.niveauActivite ?? "",
    fuseau: profil?.fuseau ?? fuseauParDefaut,
    sens: o?.sens ?? "",
    poidsCibleKg: o && o.sens !== "maintenir" ? String(o.poidsCibleKg) : "",
    rythme: o && o.sens !== "maintenir" ? String(o.rythme) : "",
    glucides: String(r.glucides),
    proteines: String(r.proteines),
    lipides: String(r.lipides),
  };
}

/** Les paramètres tant qu'ils sont complets, pour l'aperçu en direct ; null sinon. */
function parametres(v: Valeurs): ParametresObjectif | null {
  const repartition = { glucides: nombre(v.glucides), proteines: nombre(v.proteines), lipides: nombre(v.lipides) };
  const nombres = [nombre(v.tailleCm), nombre(v.poidsKg)];
  if (!v.sexe || !v.dateNaissance || !v.niveauActivite || !v.sens) return null;
  if (!nombres.every((n) => n > 0)) return null;
  const objectif =
    v.sens === "maintenir"
      ? ({ sens: "maintenir" } as const)
      : v.rythme && nombre(v.poidsCibleKg) > 0
        ? {
            sens: v.sens as "perdre" | "prendre",
            poidsCibleKg: nombre(v.poidsCibleKg),
            rythme: nombre(v.rythme) as Rythme,
          }
        : null;
  if (!objectif) return null;
  return {
    sexe: v.sexe as ParametresObjectif["sexe"],
    dateNaissance: v.dateNaissance,
    tailleCm: nombres[0],
    poidsKg: nombres[1],
    niveauActivite: v.niveauActivite as ParametresObjectif["niveauActivite"],
    objectif,
    repartition,
  };
}

function apercu(v: Valeurs): ObjectifCalcule | null {
  const p = parametres(v);
  if (!p) return null;
  const jour = jourCalendaire(new Date(), v.fuseau || "UTC");
  if (p.dateNaissance >= jour) return null;
  const totalOk = Math.abs(totalRepartition(p.repartition) - 100) < 1e-9;
  // Tant que la Répartition est fausse, les kcal restent visibles et les Macros sont masquées.
  return calculerObjectif(totalOk ? p : { ...p, repartition: REPARTITION_PAR_DEFAUT }, jour);
}

type Props = {
  profil: SaisieProfil | null;
  fuseaux: string[];
  fuseauParDefaut: string;
  /** "journal" pour la première configuration : on ouvre le Journal après l'enregistrement. */
  apres?: "journal";
};

export function FormulaireProfil({ profil, fuseaux, fuseauParDefaut, apres }: Props) {
  const [etat, action, enCours] = useActionState(enregistrerProfilAction, {});
  const garde = useGardeHorsLigne();
  const [v, setV] = useState(() => valeursInitiales(profil, fuseauParDefaut));
  const changer = (champ: keyof Valeurs) => (e: { target: { value: string } }) =>
    setV((avant) => ({ ...avant, [champ]: e.target.value }));
  const erreur = (champ: ChampProfil) => etat.erreurs?.includes(champ);
  const message = (champ: ChampProfil) => (erreur(champ) ? t.erreurs[champ] : undefined);
  const total = MACROS.reduce((s, m) => s + (nombre(v[m]) || 0), 0);
  const totalOk = Math.abs(total - 100) < 1e-9;
  const objectif = apercu(v);
  const perdreOuPrendre = v.sens === "perdre" || v.sens === "prendre";

  return (
    <form action={action} onSubmit={garde.onSubmit} className="flex flex-col gap-6">
      {apres && <input type="hidden" name="apres" value={apres} />}

      <Section titre={t.sectionProfil}>
        <Champ id="dateNaissance" label={t.dateNaissance} erreur={message("dateNaissance")}>
          <Input
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            required
            value={v.dateNaissance}
            onChange={changer("dateNaissance")}
            aria-invalid={erreur("dateNaissance") || undefined}
            className="h-10"
          />
        </Champ>

        <Choix
          legende={t.sexe}
          aide={t.sexeExplication}
          nom="sexe"
          valeur={v.sexe}
          onChange={changer("sexe")}
          erreur={message("sexe")}
          options={(["femme", "homme"] as const).map((s) => ({ valeur: s, nom: t.sexes[s] }))}
          enLigne
        />

        <div className="grid grid-cols-2 gap-3">
          <Champ id="tailleCm" label={t.tailleCm} erreur={message("tailleCm")}>
            <Input
              id="tailleCm"
              name="tailleCm"
              type="number"
              inputMode="decimal"
              step="any"
              min={50}
              max={272}
              required
              value={v.tailleCm}
              onChange={changer("tailleCm")}
              aria-invalid={erreur("tailleCm") || undefined}
              className="h-10"
            />
          </Champ>
          <Champ id="poidsKg" label={t.poidsKg} erreur={message("poidsKg")}>
            <Input
              id="poidsKg"
              name="poidsKg"
              type="number"
              inputMode="decimal"
              step="any"
              min={20}
              max={500}
              required
              value={v.poidsKg}
              onChange={changer("poidsKg")}
              aria-invalid={erreur("poidsKg") || undefined}
              className="h-10"
            />
          </Champ>
        </div>

        <Choix
          legende={t.niveauActivite}
          nom="niveauActivite"
          valeur={v.niveauActivite}
          onChange={changer("niveauActivite")}
          erreur={message("niveauActivite")}
          options={NIVEAUX_ACTIVITE.map((n) => ({
            valeur: n,
            nom: t.niveaux[n].nom,
            description: t.niveaux[n].description,
          }))}
        />

        <Champ id="fuseau" label={t.fuseau} aide={t.fuseauAide} erreur={message("fuseau")}>
          <select
            id="fuseau"
            name="fuseau"
            required
            value={v.fuseau}
            onChange={changer("fuseau")}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base md:text-sm"
          >
            {fuseaux.map((f) => (
              <option key={f} value={f}>
                {f.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Champ>
      </Section>

      <Section titre={t.sectionObjectif}>
        <Choix
          legende={t.sens}
          nom="sens"
          valeur={v.sens}
          onChange={changer("sens")}
          erreur={message("sens")}
          options={SENS_OBJECTIF.map((s) => ({ valeur: s, nom: t.sensOptions[s] }))}
        />
        {perdreOuPrendre && (
          <>
            <Champ id="poidsCibleKg" label={t.poidsCibleKg} erreur={message("poidsCibleKg")}>
              <Input
                id="poidsCibleKg"
                name="poidsCibleKg"
                type="number"
                inputMode="decimal"
                step="any"
                min={20}
                max={500}
                required
                value={v.poidsCibleKg}
                onChange={changer("poidsCibleKg")}
                aria-invalid={erreur("poidsCibleKg") || undefined}
                className="h-10"
              />
            </Champ>
            <Choix
              legende={t.rythme}
              nom="rythme"
              valeur={v.rythme}
              onChange={changer("rythme")}
              erreur={message("rythme")}
              options={RYTHMES.map((r) => ({ valeur: String(r), nom: t.rythmes[r] }))}
            />
          </>
        )}
      </Section>

      <Section titre={t.sectionMacros}>
        <div className="grid grid-cols-3 gap-3">
          {MACROS.map((m) => (
            <Champ key={m} id={m} label={t.pourcentage(t.macros[m])}>
              <Input
                id={m}
                name={m}
                type="number"
                inputMode="numeric"
                step="any"
                min={0}
                max={100}
                required
                value={v[m]}
                onChange={changer(m)}
                aria-invalid={!totalOk || undefined}
                className="h-10"
              />
            </Champ>
          ))}
        </div>
        {!totalOk && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t.totalRepartition(total)}
          </p>
        )}
      </Section>

      <ResumeObjectif objectif={objectif} titre={textes.objectif.titre} masquerMacros={!totalOk} />

      {garde.saisieBloquee && <AlerteHorsLigne />}
      {(etat.erreurs?.length || etat.erreur) && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {etat.erreur ?? [t.erreurGenerale, ...etat.erreurs!.map((c) => t.erreurs[c])].join(" ")}
        </p>
      )}
      {etat.enregistre && (
        <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          {textes.reglages.enregistre}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10" disabled={enCours || !totalOk}>
        {enCours ? t.enCours : t.bouton}
      </Button>
    </form>
  );
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-base font-semibold">{titre}</legend>
      {children}
    </fieldset>
  );
}

function Champ(props: { id: string; label: string; aide?: string; erreur?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.aide && <p className="text-xs text-muted-foreground">{props.aide}</p>}
      {props.erreur && <p className="text-xs text-destructive">{props.erreur}</p>}
    </div>
  );
}

function Choix(props: {
  legende: string;
  aide?: string;
  nom: string;
  valeur: string;
  onChange: (e: { target: { value: string } }) => void;
  options: { valeur: string; nom: string; description?: string }[];
  erreur?: string;
  enLigne?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={props.erreur ? true : undefined}>
      <legend className="mb-2 text-sm font-medium">{props.legende}</legend>
      {props.aide && <p className="-mt-1 text-xs text-muted-foreground">{props.aide}</p>}
      <div className={props.enLigne ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
        {props.options.map((o) => (
          <label
            key={o.valeur}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-2.5 text-sm has-checked:border-primary has-checked:bg-primary/5"
          >
            <input
              type="radio"
              name={props.nom}
              value={o.valeur}
              checked={props.valeur === o.valeur}
              onChange={props.onChange}
              required
              className="mt-0.5 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{o.nom}</span>
              {o.description && <span className="text-xs text-muted-foreground">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {props.erreur && <p className="text-xs text-destructive">{props.erreur}</p>}
    </fieldset>
  );
}
