CREATE TABLE "pesee" (
	"user_id" text NOT NULL,
	"jour" date NOT NULL,
	"poids_kg" double precision NOT NULL,
	CONSTRAINT "pesee_user_id_jour_pk" PRIMARY KEY("user_id","jour")
);
--> statement-breakpoint
ALTER TABLE "profil" ADD COLUMN "maintien_refuse_pour" text;--> statement-breakpoint
ALTER TABLE "pesee" ADD CONSTRAINT "pesee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;