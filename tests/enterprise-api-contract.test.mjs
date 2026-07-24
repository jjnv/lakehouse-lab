import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const routes = [
  "app/api/me/dashboard/route.ts",
  "app/api/progress/import/route.ts",
  "app/api/lessons/[moduleId]/[lessonId]/review/route.ts",
  "app/api/labs/[moduleId]/attest/route.ts",
  "app/api/assessments/route.ts",
  "app/api/assessments/[id]/route.ts",
  "app/api/assessments/[id]/submit/route.ts",
  "app/api/credentials/[id]/pdf/route.ts",
  "app/api/me/export/route.ts",
  "app/api/me/progress/route.ts",
];

test("all employee API routes resolve the learner from the authenticated session", () => {
  for (const route of routes) {
    const source = read(route);
    assert.match(source, /withLearner\s*\(/, `${route} must use the protected route wrapper`);
    assert.doesNotMatch(source, /body\.(?:email|userId)|searchParams\.get\(["'](?:email|userId)/, `${route} must not accept client identity`);
  }
  const shared = read("app/api/_shared.ts");
  assert.match(shared, /await getLearner\(\)/);
  assert.match(shared, /AUTHENTICATION_REQUIRED/);
});

test("mutations expose revision conflicts and idempotency without retaining submitted selections", () => {
  const service = read("app/enterprise/learning-service.ts");
  assert.match(service, /REVISION_CONFLICT/);
  assert.match(service, /progressRevision:\s*sql`\$\{learnerAssignments\.progressRevision\} \+ 1`/);
  assert.match(service, /IDEMPOTENCY_CONFLICT/);
  assert.match(service, /allowMonotonicMerge:\s*action === ["']complete["']/);
  assert.match(service, /schedulePreserved:\s*guard\.merged/);
  assert.match(service, /delete\(assessmentResponses\).*attemptId/s);
  assert.match(service, /selectionsJson:\s*["']\{\}["']/);
});

test("assessment routes return only the public attempt while answer material stays in the server service", () => {
  const startRoute = read("app/api/assessments/route.ts");
  const publicContract = read("app/enterprise/assessment.ts");
  assert.doesNotMatch(startRoute, /answerKey|correctOption|\.answer\b/);
  assert.doesNotMatch(publicContract, /correctOptionId|answerKeyJson/);
  assert.match(read("app/enterprise/learning-service.ts"), /answerKeyJson/);
});

test("legacy imports are unique and survive a learner progress reset", () => {
  const service = read("app/enterprise/learning-service.ts");
  assert.match(service, /insert\(legacyImports\)/);
  assert.match(service, /requiresProfessionalRevalidation:\s*true/);
  assert.doesNotMatch(service, /delete\(legacyImports\)/);
});

test("runtime tenant variables are validated server-side and reach the certificate", () => {
  const store = read("app/enterprise/store.ts");
  const brand = read("app/enterprise/brand.ts");
  const service = read("app/enterprise/learning-service.ts");
  for (const key of ["ORG_DISPLAY_NAME", "ORG_LOGO_URL", "ORG_BRAND_COLOR", "ORG_ACCENT_COLOR", "ORG_TIMEZONE", "ORG_SUPPORT_EMAIL"]) {
    assert.match(store, new RegExp(key), `${key} must be resolved from the deployment runtime`);
  }
  assert.match(brand, /primaryColor:\s*["']#20242C["']/);
  assert.match(brand, /accentColor:\s*["']#A93216["']/);
  assert.match(brand, /contrastRatio\(normalized, ["']#FFFFFF["']\) >= 4\.5/);
  assert.match(service, /pdf\.setAuthor\(brand\.organizationName\)/);
  assert.match(service, /pdfColor\(brand\.primaryColor\)/);
});
