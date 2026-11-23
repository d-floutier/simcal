CREATE TABLE "cache_recherche_off" (
	"texte" text PRIMARY KEY NOT NULL,
	"produits" jsonb NOT NULL,
	"cree_le" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cache_recherche_off_cree_le_idx" ON "cache_recherche_off" USING btree ("cree_le");