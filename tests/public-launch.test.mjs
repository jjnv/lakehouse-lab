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
  assert.match(rootPage, /getSessionUser\(\)/);
  assert.match(rootPage, /Prepara Databricks Data Engineer/u);
  assert.match(rootPage, /Ver temario/u);
  assert.doesNotMatch(rootPage, /Explorar la demo|Beta pública/);
  assert.match(rootPage, /Lakehouse Lab no está afiliado ni avalado por Databricks|proyecto independiente/i);
});

test("the legacy demo redirects while public, recovery and legal pages remain anonymous-compatible", () => {
  for (const route of ["acerca-de", "privacidad", "terminos", "recuperar"]) {
    const source = read(`app/${route}/page.tsx`);
    assert.doesNotMatch(source, /requireLearner|requireSessionUser|requireEnterprisePageContext/, `${route} must remain public`);
  }
  assert.match(read("app/demo/page.tsx"), /permanentRedirect\(["']\/catalogo["']\)/);
  assert.match(read("app/recuperar/page.tsx"), /código/i);
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

  const nextConfig = read("next.config.ts").toLowerCase();
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) {
    assert.ok(nextConfig.includes(header), `Next.js config is missing ${header}`);
  }
});

test("personal navigation exposes return and legal controls", () => {
  const shell = read("app/components/enterprise/AppShell.tsx");
  for (const expected of ["Volver a la portada", "/acerca-de", "/privacidad"]) {
    assert.ok(shell.includes(expected), `enterprise shell is missing ${expected}`);
  }
});

test("public and signed-in navigation share the curriculum concept search", () => {
  const shell = read("app/components/enterprise/AppShell.tsx");
  const search = read("app/components/enterprise/CurriculumSearch.tsx");
  const route = read("app/api/search/route.ts");
  const curriculum = read("app/enterprise/curriculum.ts");
  const course = read("app/components/enterprise/CourseWorkspace.tsx");
  assert.match(shell, /<CurriculumSearch\s*\/>/);
  assert.match(search, /Buscar conceptos en el temario/);
  assert.match(search, /Ctrl K/);
  assert.match(search, /aria-live="polite"/);
  assert.doesNotMatch(route, /withLearner/);
  assert.match(route, /cache-control/);
  assert.match(route, /searchCurriculum\(query\)/);
  assert.match(curriculum, /lesson\.deepDive\.concepts/);
  assert.match(curriculum, /normalize\("NFD"\)/);
  assert.match(course, /requestedConcept/);
  assert.match(course, /conceptAnchor\(lesson\.id, concept\.term\)/);
});

test("public-source documentation declares independent branding and licensing", () => {
  const readme = read("README.md");
  assert.match(readme, /No está afiliado, patrocinado ni avalado por Databricks/);
  assert.match(readme, /Catálogo, lecciones, laboratorios y notebooks públicos/);
  assert.match(read("LICENSE"), /MIT License/);
  assert.match(read("CONTENT-LICENSE.md"), /Attribution-ShareAlike 4\.0/);
  assert.doesNotMatch(read("CONTENT-LICENSE.md"), /NonCommercial/);
  assert.match(read("app/project-info.ts"), /github\.com\/jjnv\/lakehouse-lab/);
  assert.match(read("app/acerca-de/page.tsx"), /PROJECT_ISSUES_URL/);
});
