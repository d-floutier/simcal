CREATE TABLE "portion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aliment_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"grammes" double precision NOT NULL,
	"cree_le" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entree" ADD COLUMN "portion_id" uuid;--> statement-breakpoint
ALTER TABLE "entree" ADD COLUMN "portion_nom" text;--> statement-breakpoint
ALTER TABLE "entree" ADD COLUMN "grammes_par_portion" double precision;--> statement-breakpoint
ALTER TABLE "portion" ADD CONSTRAINT "portion_aliment_id_aliment_id_fk" FOREIGN KEY ("aliment_id") REFERENCES "public"."aliment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portion_aliment_idx" ON "portion" USING btree ("aliment_id");--> statement-breakpoint
ALTER TABLE "entree" ADD CONSTRAINT "entree_portion_id_portion_id_fk" FOREIGN KEY ("portion_id") REFERENCES "public"."portion"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aliment_code_barres_idx" ON "aliment" USING btree ("code_barres");