import { sql } from "drizzle-orm";
import {
  date,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Repas } from "@/core";
import { user } from "./auth-schema";

export type TypeAliment = "generique" | "produit" | "personnalise";
/** L'unité de référence d'un Aliment : ses valeurs sont pour 100 g ou pour 100 ml. */
export type UniteAliment = "g" | "ml";
/** L'unité dans laquelle la quantité d'une Entrée a été saisie. */
export type UniteQuantite = "g" | "ml" | "portion";

// Les valeurs nutritionnelles pour 100 g, partagées par les Aliments et la copie d'une Entrée.
const valeursPour100g = () => ({
  kcal: doublePrecision("kcal").notNull(),
  proteines: doublePrecision("proteines").notNull(),
  glucides: doublePrecision("glucides").notNull(),
  lipides: doublePrecision("lipides").notNull(),
  fibres: doublePrecision("fibres"),
  sucres: doublePrecision("sucres"),
  satures: doublePrecision("satures"),
  sel: doublePrecision("sel"),
});

/**
 * Les Aliments : génériques (CIQUAL) et Produits, partagés et en lecture seule, et Aliments
 * personnalisés, privés à leur propriétaire. `codeSource` identifie l'Aliment dans sa source
 * (code CIQUAL, code Open Food Facts) pour que les imports soient répétables.
 */
export const aliment = pgTable(
  "aliment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").$type<TypeAliment>().notNull(),
    codeSource: text("code_source"),
    nom: text("nom").notNull(),
    /** Le nom sans accents ni casse (normaliserRecherche), indexé en plein texte français. */
    nomRecherche: text("nom_recherche").notNull(),
    marque: text("marque"),
    codeBarres: text("code_barres"),
    proprietaireId: text("proprietaire_id").references(() => user.id, { onDelete: "cascade" }),
    unite: text("unite").$type<UniteAliment>().notNull().default("g"),
    ...valeursPour100g(),
    misAJour: timestamp("mis_a_jour").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("aliment_source_idx").on(t.type, t.codeSource),
    index("aliment_recherche_idx").using("gin", sql`to_tsvector('french', ${t.nomRecherche})`),
    index("aliment_proprietaire_idx").on(t.proprietaireId),
    index("aliment_code_barres_idx").on(t.codeBarres),
  ],
);

/**
 * Les Portions d'un Aliment (« 1 bol = 300 g »), quel que soit son type : l'utilisateur définit
 * celles de ses Aliments personnalisés, les Produits reçoivent celles d'Open Food Facts.
 * `grammes` est le poids (ou le volume, à 1 ml = 1 g) d'une Portion.
 */
export const portion = pgTable(
  "portion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alimentId: uuid("aliment_id")
      .notNull()
      .references(() => aliment.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    grammes: doublePrecision("grammes").notNull(),
    creeLe: timestamp("cree_le").defaultNow().notNull(),
  },
  (t) => [index("portion_aliment_idx").on(t.alimentId)],
);

/**
 * Une Entrée du Journal. Elle garde une copie du nom, de la marque et des valeurs pour 100 g
 * de l'Aliment au moment de la saisie (ADR-0001) : les totaux sont calculés à partir de cette
 * copie. Le lien vers l'Aliment devient null si l'Aliment est supprimé.
 */
export const entree = pgTable(
  "entree",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    jour: date("jour", { mode: "string" }).notNull(),
    repas: text("repas").$type<Repas>().notNull(),
    alimentId: uuid("aliment_id").references(() => aliment.id, { onDelete: "set null" }),
    /** La quantité telle que saisie, dans `unite` (pour une Portion : le nombre de Portions). */
    quantite: doublePrecision("quantite").notNull(),
    unite: text("unite").$type<UniteQuantite>().notNull(),
    /**
     * Pour une quantité en Portions : la Portion d'origine (null si elle est supprimée) et une
     * copie de son nom et de son poids au moment de la saisie (ADR-0001).
     */
    portionId: uuid("portion_id").references(() => portion.id, { onDelete: "set null" }),
    portionNom: text("portion_nom"),
    grammesParPortion: doublePrecision("grammes_par_portion"),
    /** La quantité convertie en grammes (1 ml = 1 g) : c'est elle qui sert aux calculs. */
    grammes: doublePrecision("grammes").notNull(),
    nom: text("nom").notNull(),
    marque: text("marque"),
    ...valeursPour100g(),
    creeLe: timestamp("cree_le").defaultNow().notNull(),
  },
  (t) => [index("entree_user_jour_idx").on(t.userId, t.jour)],
);
