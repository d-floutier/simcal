import { bigserial, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * L'Hydratation : une suite d'ajouts en ml par utilisateur et par jour (un Verre = un ajout).
 * Retirer un Verre supprime le dernier ajout du jour (le plus grand `id`).
 */
export const ajoutHydratation = pgTable(
  "ajout_hydratation",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    jour: date("jour", { mode: "string" }).notNull(),
    ml: integer("ml").notNull(),
    creeLe: timestamp("cree_le").defaultNow().notNull(),
  },
  (t) => [index("ajout_hydratation_user_jour_idx").on(t.userId, t.jour)],
);
