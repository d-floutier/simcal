import type { Db } from "@/db/client";
import { createAuth } from "@/lib/auth/create-auth";

export const TEST_SECRET = "test-secret-test-secret-test-secret-0000";

export function createTestAuth(db: Db, emailsAutorises: string[]) {
  return createAuth({ db, emailsAutorises, secret: TEST_SECRET, baseURL: "http://localhost:3000" });
}

/** Creates an account through Better Auth, the way the app does, and returns its id. */
export async function creerUtilisateur(db: Db, email: string): Promise<string> {
  const auth = createTestAuth(db, [email]);
  const { user } = await auth.api.signUpEmail({
    body: { email, password: "mot-de-passe-solide", name: email },
  });
  return user.id;
}
