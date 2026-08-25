import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("learning paths expose functional profile entries and documented duration math", () => {
  const source = read("app/learning-paths.ts");
  for (const id of ["associate", "professional", "databricks-cero", "streaming-cdc", "laboratorios"]) {
    assert.match(source, new RegExp(`id: "${id}"`, "u"));
  }
  for (const href of ["/catalogo?level=associate", "/catalogo", "/catalogo?phase=fundamentos", "/catalogo?phase=streaming"]) {
    assert.ok(source.includes(`href: "${href}"`), `missing functional href ${href}`);
  }
  assert.match(source, /const firstLabHref = `\/curso\/\$\{modules\[0\]\.slug\}\?section=lab`/u);
  assert.match(source, /href: firstLabHref/u);
  assert.doesNotMatch(source, /href: "\/catalogo\?level=professional"/u);
  assert.match(source, /DURATION_METHOD/u);
  assert.match(source, /module\.minutes/u);
  assert.match(source, /labOnlyMinutes/u);
});

test("editorial model provides reusable metadata, changelog and issue links", () => {
  const source = read("app/editorial-model.ts");
  assert.match(source, /editorialChangelog/u);
  assert.match(source, /moduleEditorialMetadata/u);
  assert.match(source, /lessonEditorialMetadata/u);
  assert.match(source, /issueHref/u);
  assert.match(source, /PROJECT_ISSUES_URL/u);
  assert.match(source, /No se declaran revisores externos|revisores externos/u);
});

test("lesson UX has stable urls, breadcrumbs, progressive details and privacy copy", () => {
  const course = read("app/components/enterprise/CourseWorkspace.tsx");
  const lessonRoute = read("app/curso/[slug]/[lessonId]/page.tsx");
  const search = read("app/enterprise/curriculum.ts");
  assert.match(course, /initialLessonId/u);
  assert.match(course, /singleLessonMode/u);
  assert.match(course, /\/curso\/\$\{module\.slug\}\/\$\{lesson\.id\}/u);
  assert.match(course, /className="ent-breadcrumbs"/u);
  assert.match(course, /locale === "en" \? "Breadcrumbs" : "Migas de pan"/u);
  assert.match(course, /className="ent-editorial-meta"/u);
  assert.match(course, /<summary>\{locale === "en" \? "Details" : "Detalles"\}<\/summary>/u);
  assert.match(course, /Puedes leer sin crear un espacio\. Créalo solo cuando quieras guardar\./u);
  assert.match(lessonRoute, /LearningResource/u);
  assert.match(lessonRoute, /application\/ld\+json/u);
  assert.match(search, /\/curso\/\$\{module\.slug\}\/\$\{lesson\.id\}/u);
});

test("public SEO includes new indexable routes and domain documentation", () => {
  const sitemap = read("app/sitemap.ts");
  const docs = read("docs/seo-dominio.md");
  for (const route of ["/ruta", "/recursos", "/glosario", "/metodologia", "/changelog"]) {
    assert.ok(sitemap.includes(`entry("${route}"`), `sitemap missing ${route}`);
  }
  assert.match(sitemap, /lesson\.id/u);
  assert.match(docs, /lakehouselab\.es/u);
  assert.match(docs, /NEXT_PUBLIC_SITE_URL/u);
  assert.match(docs, /canonical/u);
  assert.match(read("docs/arquitectura.md"), /app\/curriculum\/glossary\.ts/u);
});

test("english curriculum projection covers every module without pending placeholders", () => {
  const i18n = read("app/i18n/curriculum.ts");
  assert.doesNotMatch(i18n, /translation pending|pending for this|Switch to Spanish|Option 1/u);
  for (let index = 1; index <= 32; index += 1) {
    const moduleId = `m${String(index).padStart(2, "0")}`;
    assert.match(i18n, new RegExp(`${moduleId}: \\[`, "u"), `missing English lesson titles for ${moduleId}`);
  }
  for (const required of ["englishDeepDive", "englishLab", "localizeQuizQuestion", "localizeGlossaryEntry", "localizeNotebookPreview"]) {
    assert.ok(i18n.includes(required) || read("app/components/enterprise/CourseWorkspace.tsx").includes(required), `missing ${required}`);
  }
});
