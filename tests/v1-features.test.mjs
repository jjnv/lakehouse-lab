import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function filesUnder(path) {
  const entries = await readdir(new URL(`${path}/`, root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await filesUnder(child));
    else files.push(child);
  }
  return files;
}

const sources = Object.fromEntries(await Promise.all([
  "package.json",
  "vercel.json",
  "next.config.ts",
  "app/page.tsx",
  "app/layout.tsx",
  "app/editorial-data.ts",
  "app/progress.ts",
  "app/globals.css",
  "app/components/enterprise/AppShell.tsx",
  "app/components/enterprise/CatalogWorkspace.tsx",
  "app/components/enterprise/CourseWorkspace.tsx",
  "app/components/enterprise/AssessmentPanel.tsx",
  "app/components/enterprise/PortalPagesV2.tsx",
  "app/components/enterprise/getShellContext.ts",
  "app/components/enterprise/useDashboard.ts",
  "app/enterprise/auth.ts",
  "app/session-auth.ts",
  "app/entrar/route.ts",
  "app/enterprise/curriculum.ts",
  "app/enterprise/assessment.ts",
  "app/enterprise/assessment-private.ts",
  "app/enterprise/learning-service.ts",
  "app/enterprise/store.ts",
  "app/api/_shared.ts",
  "app/api/credentials/[id]/pdf/route.ts",
  "db/index.ts",
  "db/schema.ts",
].map(async (path) => [path, await read(path)])));

const protectedRouteContracts = [
  ["app/inicio/page.tsx", "/inicio"],
  ["app/mi-aprendizaje/page.tsx", "/mi-aprendizaje"],
  ["app/expediente/page.tsx", "/expediente"],
  ["app/ajustes/page.tsx", "/ajustes"],
];
const routeContracts = [
  ...protectedRouteContracts,
  ["app/simulacro/[mode]/page.tsx", "/simulacro/"],
  ["app/catalogo/page.tsx", "/catalogo"],
  ["app/curso/[slug]/page.tsx", "/curso/"],
  ["app/certificados/[id]/page.tsx", "/certificados/"],
];
const routeSources = Object.fromEntries(await Promise.all(
  routeContracts.map(async ([path]) => [path, await read(path)]),
));

const enterpriseComponentPaths = (await filesUnder("app/components/enterprise"))
  .filter((path) => /\.(?:ts|tsx)$/u.test(path));
const enterpriseComponentSources = Object.fromEntries(await Promise.all(
  enterpriseComponentPaths.map(async (path) => [path, await read(path)]),
));
const clientComponentSources = Object.entries(enterpriseComponentSources)
  .filter(([, source]) => /^\s*["']use client["'];/u.test(source));

test("declares the enterprise release as version 2.0.0 everywhere that identifies content", () => {
  const packageJson = JSON.parse(sources["package.json"]);
  assert.equal(packageJson.version, "2.0.0");
  assert.match(sources["app/editorial-data.ts"], /SITE_VERSION = "2\.0\.0"/u);
  assert.match(sources["app/progress.ts"], /CONTENT_VERSION = "lakehouse-lab-v2\.0\.0"/u);
  assert.match(sources["app/page.tsx"], /getSessionUser\(\)/u);
  assert.match(sources["app/page.tsx"], /const catalogHref = "\/catalogo"/u);
  assert.doesNotMatch(sources["app/page.tsx"], /href=["']\/demo/u);
  assert.match(sources["app/layout.tsx"], /PROJECT_NAME/u);
  assert.match(sources["app/layout.tsx"], /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/u);
  assert.match(packageJson.scripts.test, /node --test tests\/\*\.test\.mjs/u);
});

test("protects private pages while exposing hybrid learning and public credential routes", () => {
  for (const [path, returnPath] of protectedRouteContracts) {
    const source = routeSources[path];
    assert.match(source, /requireEnterprisePageContext\(/u, `${path} must require the enterprise page context`);
    assert.match(source, /<AppShell\b/u, `${path} must render inside the application shell`);
    assert.ok(source.includes(returnPath), `${path} must preserve its real return route`);
    assert.doesNotMatch(source, /href=["']#/u, `${path} must not replace navigation with an in-page hash`);
  }

  for (const path of ["app/catalogo/page.tsx", "app/curso/[slug]/page.tsx"]) {
    const source = routeSources[path];
    assert.match(source, /getOptionalEnterprisePageContext\(/u, `${path} must support anonymous reading`);
    assert.match(source, /publicMode=\{!personalized\}/u, `${path} must render the public shell without creating a session`);
    assert.doesNotMatch(source, /requireEnterprisePageContext\(/u);
  }
  assert.match(routeSources["app/certificados/[id]/page.tsx"], /getPublicCredentialVerification\(/u);
  assert.match(routeSources["app/certificados/[id]/page.tsx"], /publicMode/u);
  assert.match(routeSources["app/simulacro/[mode]/page.tsx"], /getOptionalEnterprisePageContext\(/u);
  assert.match(routeSources["app/simulacro/[mode]/page.tsx"], /<PublicShell\b/u);
  assert.match(routeSources["app/simulacro/[mode]/page.tsx"], /<SimulatorWorkspace mode=\{mode\}/u);

  const shellContext = sources["app/components/enterprise/getShellContext.ts"];
  assert.ok(shellContext.indexOf("await requireLearner(returnTo)") < shellContext.indexOf("await getOrganizationBranding"));
  assert.match(shellContext, /await getLearner\(\)/u);
  assert.match(sources["app/enterprise/auth.ts"], /await requireSessionUser\(returnTo\)/u);
  assert.match(sources["app/enterprise/auth.ts"], /await ensureLearner\(\{/u);
  assert.match(sources["app/enterprise/auth.ts"], /await bindAnonymousSession\(/u);
  assert.match(sources["app/session-auth.ts"], /SESSION_COOKIE_NAME = "lakehouse_session"/u);
  assert.match(sources["app/session-auth.ts"], /process\.env\.NODE_ENV !== "production"/u);
  assert.match(sources["app/session-auth.ts"], /if \(!value\.startsWith\("\/"\) \|\| value\.startsWith\("\/\/"\)\) return "\/"/u);
  assert.match(sources["app/session-auth.ts"], /httpOnly:\s*true/u);
  assert.match(sources["app/session-auth.ts"], /sameSite:\s*"lax"/u);
  assert.match(sources["app/entrar/route.ts"], /sessionCookieOptions\(\)/u);
  assert.match(sources["app/api/_shared.ts"], /withLearner/u);
  assert.match(sources["app/api/_shared.ts"], /401, "AUTHENTICATION_REQUIRED"/u);
  assert.match(sources["app/api/_shared.ts"], /403, "ACCESS_DENIED"/u);

  const shell = sources["app/components/enterprise/AppShell.tsx"];
  for (const route of ["/inicio", "/mi-aprendizaje", "/catalogo", "/expediente", "/ajustes"]) {
    assert.ok(shell.includes(`href: "${route}"`) || shell.includes(`href="${route}"`), `missing shell route ${route}`);
  }
});

test("course navigation remains reliable and dashboard reads avoid sequential database round trips", () => {
  for (const [path, source] of clientComponentSources) {
    assert.doesNotMatch(source, /from ["']next\/link["']/u, `${path} must use resilient document navigation`);
  }
  const catalog = sources["app/components/enterprise/CatalogWorkspace.tsx"];
  assert.match(catalog, /className="ent-card-title-link"/u);
  assert.match(catalog, /href=\{`\/curso\/\$\{module\.slug\}`\}/u);
  assert.match(catalog, /Number\(Boolean\(progress\?\.labAttested\)\)/u);

  const store = sources["app/enterprise/store.ts"];
  assert.match(store, /enterpriseBootstrapPromise/u);
  assert.match(store, /loadLearnerContext\(email\)/u);
  assert.match(store, /innerJoin\(learnerAssignments/u);
  assert.ok(store.indexOf("const existing = await loadLearnerContext(email)") < store.indexOf("db.insert(users)"));

  const service = sources["app/enterprise/learning-service.ts"];
  assert.match(service, /db\.batch\(\[/u);
  assert.match(service, /calculateModuleProgressFromRows\(lessonRows, labRows, attempts\)/u);
});

test("keeps authored course data and answer keys outside every client component", () => {
  assert.ok(clientComponentSources.length >= 6, "the enterprise UI should have client components to audit");
  for (const [path, source] of clientComponentSources) {
    assert.doesNotMatch(source, /(?:from\s*|import\s*\()["'][^"']*(?:course-data|assessment-private)[^"']*["']/u, `${path} imports server-only curriculum material`);
    assert.doesNotMatch(source, /\banswerKeyJson\b/u, `${path} exposes a stored answer key`);
  }

  const publicAssessment = sources["app/enterprise/assessment.ts"];
  assert.doesNotMatch(publicAssessment, /\b(?:answerKeyJson|correctOptionId|PrivateAssessmentDefinition)\b/u);

  const curriculum = sources["app/enterprise/curriculum.ts"];
  const projectionStart = curriculum.indexOf("quiz: module.quiz.map");
  const projectionEnd = curriculum.indexOf("\n    })),", projectionStart);
  assert.ok(projectionStart >= 0 && projectionEnd > projectionStart, "public module quiz projection is missing");
  const publicQuizProjection = curriculum.slice(projectionStart, projectionEnd);
  assert.match(publicQuizProjection, /prompt:\s*question\.question/u);
  assert.match(publicQuizProjection, /options:\s*\[\.\.\.question\.options\]/u);
  assert.match(publicQuizProjection, /domain:\s*question\.domain/u);
  assert.doesNotMatch(publicQuizProjection, /\banswer\s*:|\bexplanation\s*:/u);
  assert.match(routeSources["app/curso/[slug]/page.tsx"], /<CourseWorkspace module=\{publicModule\(courseModule\)\}/u);

  const service = sources["app/enterprise/learning-service.ts"];
  assert.match(service, /from "\.\.\/course-data"/u);
  assert.match(service, /from "\.\/assessment-private"/u);
  assert.match(service, /answerKeyJson:\s*stableJson\(prepared\.answerKey\)/u);
});

test("imports legacy progress once, sanitizes it and requires a new native Professional result", () => {
  const client = sources["app/components/enterprise/useDashboard.ts"];
  assert.match(client, /LEGACY_PROGRESS_KEY = "lakehouse-lab-progress-v2"/u);
  assert.match(client, /allowedModules = new Set\(dashboard\.modules\.map/u);
  assert.match(client, /integer\(score, 0, 4\)/u);
  assert.match(client, /clientMutationId:\s*crypto\.randomUUID\(\)/u);
  assert.match(client, /expectedRevision:\s*dashboard\.revision\.value/u);
  const importRequest = client.indexOf('fetch("/api/progress/import"');
  const acceptedResponse = client.indexOf("await readJson(response)", importRequest);
  const removeLegacy = client.indexOf("localStorage.removeItem(LEGACY_PROGRESS_KEY)", importRequest);
  assert.ok(importRequest >= 0 && acceptedResponse > importRequest && removeLegacy > acceptedResponse, "local data must only be removed after a successful import response");

  const service = sources["app/enterprise/learning-service.ts"];
  assert.match(service, /const progress = sanitizeProgress\(source\)/u);
  assert.match(service, /const scopedMutationKey = `\$\{learner\.user\.id\}:\$\{body\.clientMutationId\}`/u);
  assert.match(service, /"IMPORT_ALREADY_COMPLETED"/u);
  assert.match(service, /"SERVER_PROGRESS_EXISTS"/u);
  assert.match(service, /source:\s*"legacy_device"/u);
  assert.match(service, /provenance:\s*"legacy_client"/u);
  assert.match(service, /requiresProfessionalRevalidation:\s*true/u);
  assert.match(service, /action:\s*"learner\.legacy_import\.completed"/u);
  assert.match(service, /professionalAttempt\.provenance !== "server_graded"/u);
  assert.doesNotMatch(service, /delete\(legacyImports\)/u, "the permanent import marker must survive progress deletion");
});

test("retains static accessibility contracts in the shell, course and assessments", () => {
  const layout = sources["app/layout.tsx"];
  const shell = sources["app/components/enterprise/AppShell.tsx"];
  const course = sources["app/components/enterprise/CourseWorkspace.tsx"];
  const assessment = sources["app/components/enterprise/AssessmentPanel.tsx"];
  const styles = sources["app/globals.css"];

  assert.match(layout, /<html lang="es">/u);
  assert.match(shell, /href="#main-content">Saltar al contenido/u);
  assert.ok(shell.indexOf("<header") < shell.indexOf('<main id="main-content"'));
  assert.match(shell, /aria-current=\{isCurrent \? "page" : undefined\}/u);
  assert.match(shell, /aria-modal=\{drawerOpen && mobileNavigation \? true : undefined\}/u);
  assert.match(shell, /event\.key === "Escape"/u);
  assert.match(shell, /event\.key !== "Tab"/u);
  assert.match(shell, /menuButton\?\.focus\(\)/u);

  assert.match(course, /role="tablist"/u);
  assert.match(course, /role="tabpanel"/u);
  assert.match(course, /\["ArrowLeft", "ArrowRight", "Home", "End"\]/u);
  assert.match(course, /<pre tabIndex=\{0\}>/u);
  assert.match(course, /role="status" aria-live="polite"/u);
  assert.match(assessment, /<fieldset key=\{question\.id\}>/u);
  assert.match(assessment, /role="progressbar"/u);
  assert.match(assessment, /aria-live="assertive"/u);
  assert.match(assessment, /aria-live="polite"/u);
  assert.match(assessment, /<label htmlFor=\{`timing-/u);
  assert.match(sources["app/components/enterprise/PortalPagesV2.tsx"], /className="ent-table-wrap" tabIndex=\{0\} aria-label=/u);

  assert.match(styles, /\.ent-shell :where\([^}]+\):focus-visible\{outline:/u);
  assert.match(styles, /\.ent-skip-link:focus\{transform:none\}/u);
  assert.match(styles, /min-height:44px/u);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/u);
  assert.match(styles, /@media\(forced-colors:active\)/u);
  for (const breakpoint of [1200, 900, 700, 400]) assert.match(styles, new RegExp(`@media\\(max-width:${breakpoint}px\\)`));
});

test("persists enterprise learning in Turso and generates protected PDF credentials", () => {
  const packageJson = JSON.parse(sources["package.json"]);
  const vercel = JSON.parse(sources["vercel.json"]);
  assert.equal(vercel.framework, "nextjs");
  assert.equal(packageJson.dependencies["@libsql/client"], "0.17.4");
  assert.equal(packageJson.dependencies["pdf-lib"], "1.17.1");

  const db = sources["db/index.ts"];
  assert.match(db, /from "@libsql\/client"/u);
  assert.match(db, /from "drizzle-orm\/libsql"/u);
  assert.match(db, /TURSO_DATABASE_URL/u);
  const schema = sources["db/schema.ts"];
  for (const table of ["organizations", "users", "organizationMemberships", "learnerAssignments", "lessonProgress", "assessmentAttempts", "assessmentResponses", "learningEvents", "progressSnapshots", "credentials", "legacyImports", "auditEvents"]) {
    assert.match(schema, new RegExp(`export const ${table} = sqliteTable\\(`), `missing SQLite table ${table}`);
  }

  const service = sources["app/enterprise/learning-service.ts"];
  assert.match(service, /import \{ PDFDocument, StandardFonts, rgb(?:,[^}]*)? \} from "pdf-lib"/u);
  assert.match(service, /eq\(credentials\.userId, learner\.user\.id\)/u);
  assert.match(service, /eq\(credentials\.organizationId, learner\.organization\.id\)/u);
  assert.match(service, /const pdf = await PDFDocument\.create\(\)/u);
  assert.match(service, /pdf\.addPage\(\[841\.89, 595\.28\]\)/u);
  assert.match(service, /return pdf\.save\(\{ useObjectStreams: false, addDefaultPage: false \}\)/u);
  assert.match(service, /professionalAttempt\.kind !== "professional_exam"/u);
  assert.match(service, /professionalAttempt\.provenance !== "server_graded"/u);
  assert.match(service, /progress\.every\(\(item\) => item\.completed\)/u);

  const pdfRoute = sources["app/api/credentials/[id]/pdf/route.ts"];
  assert.match(pdfRoute, /return withLearner\(async \(learner\) =>/u);
  assert.match(pdfRoute, /"content-type": "application\/pdf"/u);
  assert.match(pdfRoute, /"content-disposition": `attachment;/u);
  assert.match(pdfRoute, /"cache-control": "private, no-store, max-age=0"/u);
});
