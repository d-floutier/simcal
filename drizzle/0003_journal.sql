CREATE TABLE "aliment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"code_source" text,
	"nom" text NOT NULL,
	"nom_recherche" text NOT NULL,
	"marque" text,
	"code_barres" text,
	"proprietaire_id" text,
	"unite" text DEFAULT 'g' NOT NULL,
	"kcal" double precision NOT NULL,
	"proteines" double precision NOT NULL,
	"glucides" double precision NOT NULL,
	"lipides" double precision NOT NULL,
	"fibres" double precision,
	"sucres" double precision,
	"satures" double precision,
	"sel" double precision,
	"mis_a_jour" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"jour" date NOT NULL,
	"repas" text NOT NULL,
	"aliment_id" uuid,
	"quantite" double precision NOT NULL,
	"unite" text NOT NULL,
	"grammes" double precision NOT NULL,
	"nom" text NOT NULL,
	"marque" text,
	"kcal" double precision NOT NULL,
	"proteines" double precision NOT NULL,
	"glucides" double precision NOT NULL,
	"lipides" double precision NOT NULL,
	"fibres" double precision,
	"sucres" double precision,
	"satures" double precision,
	"sel" double precision,
	"cree_le" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aliment" ADD CONSTRAINT "aliment_proprietaire_id_user_id_fk" FOREIGN KEY ("proprietaire_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entree" ADD CONSTRAINT "entree_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entree" ADD CONSTRAINT "entree_aliment_id_aliment_id_fk" FOREIGN KEY ("aliment_id") REFERENCES "public"."aliment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "aliment_source_idx" ON "aliment" USING btree ("type","code_source");--> statement-breakpoint
CREATE INDEX "aliment_recherche_idx" ON "aliment" USING gin (to_tsvector('french', "nom_recherche"));--> statement-breakpoint
CREATE INDEX "aliment_proprietaire_idx" ON "aliment" USING btree ("proprietaire_id");--> statement-breakpoint
CREATE INDEX "entree_user_jour_idx" ON "entree" USING btree ("user_id","jour");