import { connect, type Db } from "@/db/client";

/** A fresh in-memory Postgres (PGlite) with the production migrations applied. */
export async function createTestDb(): Promise<Db> {
  const conn = connect({});
  await conn.migrate();
  return conn.db;
}
