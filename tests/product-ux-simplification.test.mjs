import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0, `missing section start: ${start}`);
  assert.ok(endIndex > startIndex, `missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

test("the public shell keeps one concise primary navigation and marks its active destination", async () => {
  const source = await read("app/components/public/PublicShell.tsx");
  const navigation = section(source, "function PublicNavigationLinks", "export default function PublicShell");

  for (const route of ["/ruta", "/catalogo", "/simulacros"]) {
    assert.ok(navigation.includes(`href=\"${route}\"`), `public primary navigation is missing ${route}`);
  }
  for (const retiredPrimary of ["/recursos", "/glosario", "/inicio"]) {
    assert.ok(!navigation.includes(`href=\"${retiredPrimary}\"`), `${retiredPrimary} must not compete in the public primary navigation`);
  }
  assert.match(navigation, /aria-current=\{active === "route" \? "page" : undefined\}/u);
  assert.match(navigation, /aria-current=\{active === "simulacros" \? "page" : undefined\}/u);
  assert.match(source, /aria-controls="public-navigation-dialog"/u);
  assert.match(source, /aria-haspopup="dialog"/u);
  assert.match(source, /<a className="public-header-action" href=\{accountHref\}>/u);
  assert.doesNotMatch(navigation, /accountHref|text\.progress/u, "account/progress must remain a single separate action");
});

test("AppShell variants separate public exploration, authenticated work and focused courses", async () => {
  const shell = await read("app/components/enterprise/AppShell.tsx");
  assert.match(shell, /AppShellVariant = "explore" \| "workspace" \| "course"/u);
  assert.match(shell, /variant: AppShellVariant/u);
  assert.match(shell, /authenticated: boolean/u);
  assert.doesNotMatch(shell, /publicMode|courseMode|eyebrow/u);

  const workspace = section(shell, "const workspaceNavigation", "const exploreNavigation");
  for (const route of ["/inicio", "/mi-aprendizaje", "/catalogo", "/expediente"]) {
    assert.ok(workspace.includes(`href: \"${route}\"`), `workspace navigation is missing ${route}`);
  }
  for (const retiredPrimary of ["/recursos", "/ajustes", "/simulacros"]) {
    assert.ok(!workspace.includes(`href: \"${retiredPrimary}\"`), `${retiredPrimary} must not compete in workspace primary navigation`);
  }
  assert.match(workspace, /activeWhen: \["catalog", "resources"\]/u, "resource pages must mark Temario as current");

  const explore = section(shell, "const exploreNavigation", "const navigation =");
  for (const route of ["/ruta", "/catalogo", "/simulacros"]) {
    assert.ok(explore.includes(`href: \"${route}\"`), `explore navigation is missing ${route}`);
  }
  assert.match(shell, /const hasGlobalNavigation = variant !== "course"/u);
  assert.match(shell, /const brandHref = authenticated \? "\/inicio" : "\/"/u);
  assert.match(shell, /const accountHref = authenticated \? "\/ajustes" : "\/entrar\?return_to=%2Finicio"/u);
  assert.match(shell, /item\.activeWhen\.includes\(active\)/u);
  assert.match(shell, /aria-current=\{isCurrent \? "page" : undefined\}/u);
  assert.match(shell, /aria-current=\{authenticated && active === "settings" \? "page" : undefined\}/u);
});

test("every AppShell call declares its variant and authentication state explicitly", async () => {
  const contracts = [
    ["app/inicio/page.tsx", /variant="workspace" authenticated/u],
    ["app/mi-aprendizaje/page.tsx", /variant="workspace" authenticated/u],
    ["app/expediente/page.tsx", /variant="workspace" authenticated/u],
    ["app/ajustes/page.tsx", /variant="workspace" authenticated/u],
    ["app/simulacro/[mode]/page.tsx", /variant="workspace" authenticated/u],
    ["app/catalogo/page.tsx", /variant=\{personalized \? "workspace" : "explore"\}\s+authenticated=\{personalized\}/u],
    ["app/recursos/page.tsx", /variant=\{personalized \? "workspace" : "explore"\}\s+authenticated=\{personalized\}/u],
    ["app/curso/[slug]/page.tsx", /variant="course" authenticated=\{personalized\}/u],
    ["app/curso/[slug]/[lessonId]/page.tsx", /variant="course" authenticated=\{personalized\}/u],
    ["app/certificados/[id]/page.tsx", /variant="explore" authenticated=\{false\}/u],
  ];

  for (const [path, expected] of contracts) {
    const source = await read(path);
    assert.match(source, expected, `${path} must choose an AppShell variant and authentication state`);
    assert.doesNotMatch(source, /publicMode|courseMode|eyebrow/u);
  }
});

test("SaveState is bilingual, silent while idle and escalates failures", async () => {
  const [component, dashboard] = await Promise.all([
    read("app/components/enterprise/SaveState.tsx"),
    read("app/components/enterprise/useDashboard.ts"),
  ]);

  assert.match(component, /SaveStateValue = "idle" \| "saving" \| "saved" \| "offline" \| "error"/u);
  assert.match(component, /if \(value === "idle"\) return null/u);
  for (const message of ["Guardando…", "Guardado", "Sin conexión", "No se pudo guardar", "Saving…", "Saved", "Offline", "Could not save"]) {
    assert.ok(component.includes(message), `SaveState is missing bilingual copy: ${message}`);
  }
  assert.match(component, /role=\{value === "error" \? "alert" : "status"\}/u);
  assert.match(component, /aria-live=\{value === "error" \? "assertive" : "polite"\}/u);
  assert.match(component, /value === "error" && onRetry/u);

  assert.match(dashboard, /useState<SaveStateValue>\("idle"\)/u);
  assert.match(dashboard, /if \(next === "saved"\)/u);
  assert.match(dashboard, /setSaveStateValue\("idle"\)/u);
  assert.match(dashboard, /3_000/u);
});

test("the private simulator consumes complete Spanish and English copy", async () => {
  const [workspace, dictionaries] = await Promise.all([
    read("app/components/enterprise/SimulatorWorkspace.tsx"),
    read("app/i18n/dictionaries.ts"),
  ]);

  for (const key of ["title", "desc", "thresholdLabel", "thresholdVal", "thresholdDesc", "bestScoreLabel", "bestScoreDesc", "timingLabel", "timingVal", "timingDesc", "disclaimerTitle", "disclaimerBody"]) {
    assert.match(dictionaries, new RegExp(`\\b${key}:`, "u"), `simulator dictionary is missing ${key}`);
    assert.match(workspace, new RegExp(`text\\.${key}\\b`, "u"), `SimulatorWorkspace does not consume ${key}`);
  }
  assert.match(workspace, /const modeLabel = mode === "associate" \? "Associate" : "Professional"/u);
  assert.match(workspace, /const simulatorTitle = text\.title\(modeLabel\)/u);
  assert.match(workspace, /<AssessmentPanel[^>]+title=\{simulatorTitle\}[^>]+locale=\{locale\}/u);
  assert.match(workspace, /<SaveState[^>]+locale=\{locale\}/u);
  assert.doesNotMatch(workspace, /titleAssociate|titlePro|introDesc|timingAdap/u);
  for (const message of ["Preguntas originales", "Original questions", "Adaptación de tiempo", "Time adjustment"]) {
    assert.ok(dictionaries.includes(message), `simulator copy is missing ${message}`);
  }
});

test("goal destinations lead to the complete Professional path and the first real lab", async () => {
  const [paths, professional] = await Promise.all([
    read("app/learning-paths.ts"),
    read("app/professional/page.tsx"),
  ]);
  const professionalProfile = section(paths, 'id: "professional"', 'id: "databricks-cero"');
  const labsProfile = section(paths, 'id: "laboratorios"', "];\n\nexport function getLearningPathProfile");

  assert.match(professionalProfile, /href: "\/catalogo"/u);
  assert.doesNotMatch(professionalProfile, /level=professional/u);
  assert.match(professional, /href="\/catalogo"/u);
  assert.doesNotMatch(professional, /level=professional/u);
  assert.match(paths, /const firstLabHref = `\/curso\/\$\{modules\[0\]\.slug\}\?section=lab`/u);
  assert.match(labsProfile, /href: firstLabHref/u);
  assert.match(labsProfile, /cta: "Abrir el primer laboratorio"/u);
  assert.doesNotMatch(labsProfile, /href: "\/recursos"/u);
});

test("catalog surfaces use canonical paths, durable filters and resource permalinks", async () => {
  const [catalogPage, resourcesPage, workspace] = await Promise.all([
    read("app/catalogo/page.tsx"),
    read("app/recursos/page.tsx"),
    read("app/components/enterprise/CatalogWorkspace.tsx"),
  ]);

  assert.match(catalogPage, /permanentRedirect/u);
  assert.match(catalogPage, /view/u);
  assert.match(catalogPage, /\/recursos/u);
  assert.match(catalogPage, /URLSearchParams/u);
  assert.match(catalogPage, /key === "view"/u);
  assert.match(catalogPage, /Array\.isArray\(value\)[\s\S]*preserved\.append\(key, item\)/u);
  assert.match(resourcesPage, /surface="resources"/u);
  assert.match(catalogPage, /surface="modules"/u);

  assert.match(workspace, /surface:\s*CatalogSurface/u);
  assert.doesNotMatch(workspace, /initialView/u);
  assert.match(workspace, /href="\/catalogo"/u);
  assert.match(workspace, /href="\/recursos"/u);
  assert.match(workspace, /new URLSearchParams\(window\.location\.search\)/u);
  assert.match(workspace, /window\.location\.pathname/u);
  for (const parameter of ["q", "phase", "level", "status", "difficulty", "format", "preview"]) {
    assert.ok(workspace.includes(`[\"${parameter}\"`) || workspace.includes(`\"${parameter}\"`), `catalog permalink is missing ${parameter}`);
  }
  assert.match(workspace, /history\[push \? "pushState" : "replaceState"\]/u);
  assert.match(workspace, /section=resources&resource=\$\{encodeURIComponent\(resource\.id\)\}/u);
});
