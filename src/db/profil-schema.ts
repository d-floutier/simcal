import { date, doublePrecision, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { NiveauActivite, SensObjectif, Sexe } from "@/core";
import { user } from "./auth-schema";

// Les paramètres de l'Objectif, partagés par le Profil courant et l'historique.
const parametresObjectif = () => ({
  sexe: text("sexe").$type<Sexe>().notNull(),
  dateNaissance: date("date_naissance", { mode: "string" }).notNull(),
  tailleCm: doublePrecision("taille_cm").notNull(),
  poidsKg: doublePrecision("poids_kg").notNull(),
  niveauActivite: text("niveau_activite").$type<NiveauActivite>().notNull(),
  sens: text("sens").$type<SensObjectif>().notNull(),
  poidsCibleKg: doublePrecision("poids_cible_kg"),
  rythme: doublePrecision("rythme"),
  glucidesPct: doublePrecision("glucides_pct").notNull(),
  proteinesPct: doublePrecision("proteines_pct").notNull(),
  lipidesPct: doublePrecision("lipides_pct").notNull(),
});

/** Le Profil courant, un par utilisateur : ce que montrent les réglages. */
export const profil = pgTable("profil", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  fuseau: text("fuseau").notNull(),
  ...parametresObjectif(),
  /**
   * L'Objectif (« perdre:72 ») pour lequel l'utilisateur a refusé de passer en « maintenir »
   * une fois son Poids cible atteint : la proposition ne revient pas tant qu'il est inchangé.
   */
  maintienRefusePour: text("maintien_refuse_pour"),
  /** L'Objectif d'hydratation courant, en ml (2 L par défaut). */
  objectifHydratationMl: integer("objectif_hydratation_ml").notNull().default(2000),
  /** La taille du Verre, en ml (250 ml par défaut). Simple réglage : pas d'historique. */
  verreMl: integer("verre_ml").notNull().default(250),
  misAJour: timestamp("mis_a_jour").defaultNow().notNull(),
});

/**
 * L'historique de l'Objectif : une ligne par jour de changement, valable à partir de `depuis`.
 * L'objectif d'un jour est la dernière ligne à cette date ou avant. On garde les paramètres
 * (pas les kcal) pour que l'âge suive la date du jour demandé. L'Objectif d'hydratation est
 * conservé jour par jour dans la même ligne : tout écrivain de l'historique doit le reporter.
 */
export const objectifHistorique = pgTable(
  "objectif_historique",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    depuis: date("depuis", { mode: "string" }).notNull(),
    ...parametresObjectif(),
    objectifHydratationMl: integer("objectif_hydratation_ml").notNull().default(2000),
  },
  (t) => [primaryKey({ columns: [t.userId, t.depuis] })],
);
