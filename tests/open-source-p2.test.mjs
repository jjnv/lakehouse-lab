import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("publishes an open-source contribution and governance baseline", async () => {
  const [contentLicense, licenses, contributing, governance, security, roadmap, workflow] = await Promise.all([
    read("CONTENT-LICENSE.md"),
    read("LICENSES.md"),
    read("CONTRIBUTING.md"),
    read("GOVERNANCE.md"),
    read("SECURITY.md"),
    read("ROADMAP.md"),
    read(".github/workflows/ci.yml"),
  ]);
  assert.match(contentLicense, /CC BY-SA 4\.0/u);
  assert.doesNotMatch(contentLicense, /NonCommercial|BY-NC/u);
  assert.match(licenses, /MIT/u);
  assert.match(contributing, /Developer Certificate of Origin|DCO/u);
  assert.match(governance, /mantenedor/iu);
  assert.match(security, /vulnerabil/iu);
  assert.match(roadmap, /P0|prioridad/iu);
  assert.match(workflow, /npm run lint/u);
  assert.match(workflow, /npm run typecheck/u);
  assert.match(workflow, /npm run test:unit/u);
  assert.match(workflow, /npm run build/u);
});

test("keeps curriculum reading and curated notebook previews public", async () => {
  const [rootPage, catalogPage, coursePage, searchRoute, previewRoute] = await Promise.all([
    read("app/page.tsx"),
    read("app/catalogo/page.tsx"),
    read("app/curso/[slug]/page.tsx"),
    read("app/api/search/route.ts"),
    read("app/api/resources/[resourceId]/preview/route.ts"),
  ]);
  assert.match(rootPage, /const catalogHref = "\/catalogo"/u);
  assert.match(rootPage, /const notebooksHref = "\/catalogo\?view=resources"/u);
  for (const source of [catalogPage, coursePage]) {
    assert.match(source, /getOptionalEnterprisePageContext/u);
    assert.doesNotMatch(source, /requireEnterprisePageContext/u);
  }
  for (const source of [searchRoute, previewRoute]) {
    assert.doesNotMatch(source, /withLearner/u);
    assert.match(source, /public/u);
  }
});

test("persists onboarding preferences and turns them into a weekly plan", async () => {
  const [schema, route, service, dashboard, migration] = await Promise.all([
    read("db/schema.ts"),
    read("app/api/me/preferences/route.ts"),
    read("app/enterprise/learning-service.ts"),
    read("app/components/enterprise/PortalPagesV2.tsx"),
    read("drizzle/0002_famous_nomad.sql"),
  ]);
  assert.match(schema, /learnerPreferences/u);
  assert.match(migration, /CREATE TABLE `learner_preferences`/u);
  assert.match(route, /updateLearnerPreferences/u);
  assert.match(service, /weeklyTargetMinutes/u);
  assert.match(service, /preferences\.updated/u);
  assert.match(dashboard, /PreferencesForm/u);
  for (const prompt of ["Objetivo", "tiempo tienes por semana", "Entorno principal"]) {
    assert.match(dashboard, new RegExp(prompt, "u"));
  }
});

test("resumes assessments and requires an explicit review before submission", async () => {
  const [route, panel, service] = await Promise.all([
    read("app/api/assessments/route.ts"),
    read("app/components/enterprise/AssessmentPanel.tsx"),
    read("app/enterprise/learning-service.ts"),
  ]);
  assert.match(route, /export async function GET/u);
  assert.match(route, /getActiveAssessment/u);
  assert.match(service, /status,\s*"started"/u);
  assert.match(panel, /sessionStorage/u);
  assert.match(panel, /Mapa de preguntas/u);
  assert.match(panel, /Marcar para revisar/u);
  assert.match(panel, /Revisión final/u);
  assert.match(panel, /Confirmar entrega/u);
});

test("exposes public certificate verification without exposing private progress", async () => {
  const [page, view, service] = await Promise.all([
    read("app/certificados/[id]/page.tsx"),
    read("app/components/enterprise/CredentialView.tsx"),
    read("app/enterprise/learning-service.ts"),
  ]);
  assert.match(page, /getPublicCredentialVerification/u);
  assert.doesNotMatch(page, /requireEnterprisePageContext/u);
  assert.match(view, /Credencial revocada/u);
  assert.match(view, /No se pudo verificar/u);
  assert.match(service, /verificationHref: `\/certificados\/\$\{encodeURIComponent\(row\.id\)\}\?code=/u);
  assert.match(service, /eq\(credentials\.verificationCode, verificationCode\)/u);
});
