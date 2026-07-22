import { mkdir } from "node:fs/promises";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const url = process.env.TURSO_DATABASE_URL?.trim()
  ?? (isProduction ? "" : "file:.data/lakehouse.db");

if (!url) {
  throw new Error("TURSO_DATABASE_URL is required. Connect Turso to the Vercel project before deploying.");
}

if (url.startsWith("file:")) await mkdir(".data", { recursive: true });

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("Database migrations are up to date.");
} finally {
  client.close();
}
