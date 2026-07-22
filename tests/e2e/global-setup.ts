import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

export default function globalSetup() {
  const dataDirectory = path.resolve(".data");
  const databasePath = path.join(dataDirectory, "e2e.db");
  mkdirSync(dataDirectory, { recursive: true });
  for (const suffix of ["", "-shm", "-wal"]) rmSync(`${databasePath}${suffix}`, { force: true });

  execFileSync(process.execPath, [path.resolve("scripts/migrate.mjs")], {
    cwd: process.cwd(),
    env: { ...process.env, TURSO_DATABASE_URL: "file:.data/e2e.db" },
    stdio: "inherit",
  });
}
