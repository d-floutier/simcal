import { date, doublePrecision, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/** Les Pesées : au plus une par jour et par utilisateur (clé primaire utilisateur + jour). */
export const pesee = pgTable(
  "pesee",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    jour: date("jour", { mode: "string" }).notNull(),
    poidsKg: doublePrecision("poids_kg").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jour] })],
);
