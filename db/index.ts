import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (database) return database;

  const url = process.env.TURSO_DATABASE_URL?.trim()
    ?? (process.env.NODE_ENV === "production" ? "" : "file:.data/lakehouse.db");
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required in production. Connect a Turso database from the Vercel Marketplace.");
  }

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  });
  database = drizzle(client, { schema });
  return database;
}
