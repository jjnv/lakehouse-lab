import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("the root is a public landing page instead of a protected redirect", () => {
  const rootPage = read("app/page.tsx");
  assert.doesNotMatch(rootPage, /redirect\s*\(\s*["']\/inicio/);
  assert.doesNotMatch(rootPage, /requireLearner|requireEnterprisePageContext/);
  assert.match(rootPage, /getChatGPTUser\(\)/);
  assert.match(rootPage, /Explorar la demo/);
  assert.match(rootPage, /No está afiliado|proyecto independiente/i);
});

test("the demo and legal pages remain anonymous-compatible", () => {
  for (const route of ["demo", "acerca-de", "privacidad", "terminos"]) {
    const source = read(`app/${route}/page.tsx`);
    assert.doesNotMatch(source, /requireLearner|requireChatGPTUser|requireEnterprisePageContext/, `${route} must remain public`);
  }
  assert.match(read("app/demo/page.tsx"), /no escribe datos|no guarda actividad/i);
  assert.match(read("app/privacidad/page.tsx"), /exportar|eliminación|conserva/i);
  assert.match(read("app/terminos/page.tsx"), /no está afiliado|no es un producto oficial/i);
});

test("public metadata is indexable and uses the launch social card", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /index:\s*true/);
  assert.match(layout, /follow:\s*true/);
  assert.match(layout, /og-public\.png/);
  assert.doesNotMatch(layout, /Academia interna|Enterprise/);
  assert.match(layout, /PROJECT_PUBLIC_URL/);
  assert.doesNotMatch(layout, /x-forwarded-host|incoming\.get\(["']host/);
});

test("public mutations and responses include launch security hardening", () => {
  const sharedApi = read("app/api/_shared.ts");
  assert.match(sharedApi, /contentType !== "application\/json"/);
  assert.match(sharedApi, /fetchSite === "cross-site"/);
  assert.match(sharedApi, /origin !== expectedOrigin/);

  const worker = read("worker/index.ts");
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) {
    assert.ok(worker.includes(header), `worker is missing ${header}`);
  }
});

test("signed-in navigation exposes account and legal controls", () => {
  const shell = read("app/components/enterprise/AppShell.tsx");
  for (const expected of ["Cerrar sesión", "/acerca-de", "/privacidad"]) {
    assert.ok(shell.includes(expected), `enterprise shell is missing ${expected}`);
  }
});

test("public-source documentation declares independent branding and licensing", () => {
  const readme = read("README.md");
  assert.match(readme, /No está afiliado, patrocinado ni avalado por Databricks/);
  assert.match(readme, /Portada y demo públicas/);
  assert.match(read("LICENSE"), /MIT License/);
  assert.match(read("CONTENT-LICENSE.md"), /Attribution-NonCommercial-ShareAlike 4\.0/);
  assert.match(read("app/project-info.ts"), /github\.com\/jjnv\/lakehouse-lab/);
  assert.match(read("app/acerca-de/page.tsx"), /PROJECT_ISSUES_URL/);
});
