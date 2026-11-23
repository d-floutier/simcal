import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { createTestAuth } from "@/test/utilisateurs";
import { INSCRIPTION_NON_AUTORISEE } from "@/lib/auth/create-auth";
import { parseListeAutorisee } from "@/lib/auth/liste-autorisee";
import type { Db } from "@/db/client";

const motDePasse = "mot-de-passe-solide";

describe("inscription fermée", () => {
  let db: Db;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("laisse un email de la liste autorisée créer un compte puis se connecter", async () => {
    const auth = createTestAuth(db, parseListeAutorisee("moi@exemple.fr, ami@exemple.fr"));

    await auth.api.signUpEmail({ body: { email: "Ami@Exemple.fr", password: motDePasse, name: "Ami" } });
    const connexion = await auth.api.signInEmail({ body: { email: "ami@exemple.fr", password: motDePasse } });

    expect(connexion.user.email).toBe("ami@exemple.fr");
    expect(connexion.token).toBeTruthy();
  });

  it("refuse un email absent de la liste, sans créer de compte", async () => {
    const auth = createTestAuth(db, ["moi@exemple.fr"]);

    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({ email: "intrus@exemple.fr", password: motDePasse, name: "Intrus" }),
      }),
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ message: INSCRIPTION_NON_AUTORISEE });
    await expect(
      auth.api.signInEmail({ body: { email: "intrus@exemple.fr", password: motDePasse } }),
    ).rejects.toThrow();
  });

  it("refuse tout le monde quand la liste est vide", async () => {
    const auth = createTestAuth(db, parseListeAutorisee(undefined));

    await expect(
      auth.api.signUpEmail({ body: { email: "moi@exemple.fr", password: motDePasse, name: "Moi" } }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
