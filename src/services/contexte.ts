import type { Db } from "@/db/client";

/** Every service runs for one signed-in user: all reads and writes are scoped by userId. */
export type Contexte = { db: Db; userId: string };

/** Une transaction ouverte sur la base du contexte. */
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
