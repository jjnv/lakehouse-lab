import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function loadRecoveryModule() {
  const source = await read("app/enterprise/anonymous-recovery.ts");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const temporary = await mkdtemp(join(tmpdir(), "lakehouse-recovery-"));
  const modulePath = join(temporary, "anonymous-recovery.cjs");
  await writeFile(modulePath, output, "utf8");
  const loaded = createRequire(import.meta.url)(modulePath);
  await rm(temporary, { recursive: true, force: true });
  return loaded;
}

test("recovery codes have portable formatting, high entropy and domain-separated hashes", async () => {
  const recovery = await loadRecoveryModule();
  const first = recovery.generateRecoveryCode();
  const second = recovery.generateRecoveryCode();
  assert.match(first, /^LLR-(?:[A-F0-9]{8}-){4}[A-F0-9]{8}$/u);
  assert.notEqual(first, second);
  assert.equal(recovery.normalizeRecoveryCode(`  ${first.toLowerCase()}  `), first);
  assert.equal(recovery.normalizeRecoveryCode("LLR-invalid"), null);
  assert.equal(recovery.hashRecoveryCode(first), recovery.hashRecoveryCode(first.toLowerCase()));
  assert.match(recovery.hashRecoveryCode(first), /^[a-f0-9]{64}$/u);
  assert.notEqual(recovery.hashRecoveryCode(first), recovery.hashSessionToken(first));
});

test("session and recovery expiry are explicit and bounded", async () => {
  const recovery = await loadRecoveryModule();
  const now = new Date("2026-07-23T12:00:00.000Z");
  assert.equal(
    recovery.expiryIsoFromNow(recovery.SESSION_TTL_SECONDS, now),
    "2027-07-23T12:00:00.000Z",
  );
  assert.equal(recovery.RECOVERY_CODE_TTL_DAYS, 90);
});

test("database and routes persist only hashes and support rotation, recovery and revocation", async () => {
  const [schema, migration, store, auth, signIn, recoveryRoute, sessionRoute] = await Promise.all([
    read("db/schema.ts"),
    read("drizzle/0001_anonymous_identity_recovery.sql"),
    read("app/enterprise/store.ts"),
    read("app/session-auth.ts"),
    read("app/entrar/route.ts"),
    read("app/api/me/recovery-code/route.ts"),
    read("app/api/session/route.ts"),
  ]);

  for (const source of [schema, migration]) {
    assert.match(source, /anonymous_(?:recovery_credentials|sessions)/u);
    assert.doesNotMatch(source, /(?:recovery_code|session_token|raw_secret)/u);
  }
  assert.match(schema, /codeHash:\s*text\("code_hash"\)/u);
  assert.match(schema, /tokenHash:\s*text\("token_hash"\)\.primaryKey/u);
  assert.match(store, /onConflictDoUpdate\(\{\s*target:\s*anonymousRecoveryCredentials\.userId/su);
  assert.match(store, /gt\(anonymousRecoveryCredentials\.expiresAt,\s*usedAt\)/u);
  assert.match(store, /isNull\(anonymousRecoveryCredentials\.revokedAt\)/u);
  assert.match(store, /db\.transaction\(async \(tx\)/u);
  assert.doesNotMatch(store, /code:\s*code[,}]/u);

  assert.match(auth, /resolveAnonymousSession\(sessionHash\)/u);
  assert.match(signIn, /if \(!await getSessionUser\(\)\)/u);
  assert.match(recoveryRoute, /withLearner\(async \(learner\)/u);
  assert.match(recoveryRoute, /await readJson\(request\)/u);
  assert.match(sessionRoute, /response\.cookies\.set\(SESSION_COOKIE_NAME,\s*sessionId,\s*sessionCookieOptions\(\)\)/u);
  assert.match(sessionRoute, /revokeAnonymousSession\(sessionHash\)/u);
  assert.match(sessionRoute, /maxAge:\s*0/u);
});
