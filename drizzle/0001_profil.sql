CREATE TABLE "objectif_historique" (
	"user_id" text NOT NULL,
	"depuis" date NOT NULL,
	"sexe" text NOT NULL,
	"date_naissance" date NOT NULL,
	"taille_cm" double precision NOT NULL,
	"poids_kg" double precision NOT NULL,
	"niveau_activite" text NOT NULL,
	"sens" text NOT NULL,
	"poids_cible_kg" double precision,
	"rythme" double precision,
	"glucides_pct" double precision NOT NULL,
	"proteines_pct" double precision NOT NULL,
	"lipides_pct" double precision NOT NULL,
	CONSTRAINT "objectif_historique_user_id_depuis_pk" PRIMARY KEY("user_id","depuis")
);
--> statement-breakpoint
CREATE TABLE "profil" (
	"user_id" text PRIMARY KEY NOT NULL,
	"fuseau" text NOT NULL,
	"sexe" text NOT NULL,
	"date_naissance" date NOT NULL,
	"taille_cm" double precision NOT NULL,
	"poids_kg" double precision NOT NULL,
	"niveau_activite" text NOT NULL,
	"sens" text NOT NULL,
	"poids_cible_kg" double precision,
	"rythme" double precision,
	"glucides_pct" double precision NOT NULL,
	"proteines_pct" double precision NOT NULL,
	"lipides_pct" double precision NOT NULL,
	"mis_a_jour" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "objectif_historique" ADD CONSTRAINT "objectif_historique_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profil" ADD CONSTRAINT "profil_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;