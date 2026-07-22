import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  const wrangler = path.resolve("node_modules/wrangler/bin/wrangler.js");
  execFileSync(process.execPath, [
    wrangler,
    "d1",
    "migrations",
    "apply",
    "site-creator-d1",
    "--local",
    "--persist-to=.wrangler/e2e",
    "--config=tests/wrangler.e2e.jsonc",
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
}
