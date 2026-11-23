CREATE TABLE "ajout_hydratation" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"jour" date NOT NULL,
	"ml" integer NOT NULL,
	"cree_le" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "objectif_historique" ADD COLUMN "objectif_hydratation_ml" integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE "profil" ADD COLUMN "objectif_hydratation_ml" integer DEFAULT 2000 NOT NULL;--> statement-breakpoint
ALTER TABLE "profil" ADD COLUMN "verre_ml" integer DEFAULT 250 NOT NULL;--> statement-breakpoint
ALTER TABLE "ajout_hydratation" ADD CONSTRAINT "ajout_hydratation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ajout_hydratation_user_jour_idx" ON "ajout_hydratation" USING btree ("user_id","jour");