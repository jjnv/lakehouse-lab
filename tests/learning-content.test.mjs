import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import test, { after } from "node:test";
import ts from "typescript";

const workspace = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), "lakehouse-learning-content-"));
const require = createRequire(import.meta.url);
const compiled = new Set();

async function existingSource(basePath) {
  const candidates = extname(basePath)
    ? [basePath]
    : [`${basePath}.ts`, `${basePath}.tsx`, join(basePath, "index.ts"), join(basePath, "index.tsx")];
  for (const candidate of candidates) {
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`No se pudo resolver el módulo local ${basePath}`);
}

async function compileSource(sourcePath) {
  const absolute = resolve(sourcePath);
  if (compiled.has(absolute)) return;
  compiled.add(absolute);
  const source = await readFile(absolute, "utf8");
  const ast = ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true, absolute.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const relativeImports = [];
  for (const statement of ast.statements) {
    const specifier = (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))
      && statement.moduleSpecifier
      && ts.isStringLiteralLike(statement.moduleSpecifier)
      ? statement.moduleSpecifier.text
      : null;
    if (specifier?.startsWith(".")) relativeImports.push(specifier);
  }
  for (const specifier of relativeImports) {
    await compileSource(await existingSource(resolve(dirname(absolute), specifier)));
  }
  const result = ts.transpileModule(source, {
    fileName: absolute,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
    },
  });
  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.deepEqual(errors, [], `No se pudo transpilar ${absolute}`);
  const relative = absolute.slice(workspace.length + 1).replace(/\.(?:ts|tsx)$/u, ".js");
  const target = join(temporary, relative);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, result.outputText, "utf8");
}

for (const entry of ["app/course-data.ts", "app/i18n/curriculum.ts", "app/curriculum/glossary.ts", "app/curriculum/foundations.ts", "app/curriculum/lesson-essentials/index.ts"]) {
  await compileSource(join(workspace, entry));
}

const course = require(join(temporary, "app/course-data.js"));
const localization = require(join(temporary, "app/i18n/curriculum.js"));
const glossary = require(join(temporary, "app/curriculum/glossary.js"));
const foundations = require(join(temporary, "app/curriculum/foundations.js"));
const essentials = require(join(temporary, "app/curriculum/lesson-essentials/index.js"));

after(async () => {
  await rm(temporary, { recursive: true, force: true });
});

const words = (value) => value.trim().split(/\s+/u).filter(Boolean).length;

const ORIGINAL_GLOSSARY_IDS = [
  "account", "workspace", "unity-catalog", "metastore", "catalog", "schema", "managed-table", "external-table",
  "volume", "delta-lake", "delta-table", "transaction-log", "time-travel", "vacuum", "merge", "change-data-feed",
  "compute", "job-cluster", "serverless-compute", "sql-warehouse", "databricks-runtime", "notebook", "git-folders",
  "declarative-automation-bundles", "lakeflow-jobs", "task", "lakeflow-pipelines", "expectations", "lakeflow-connect",
  "auto-loader", "copy-into", "structured-streaming", "checkpoint", "watermark", "photon", "optimize",
  "liquid-clustering", "data-skipping", "query-profile", "system-tables", "service-principal",
  "personal-access-token", "secret-scope", "dbu", "medallion-architecture", "bronze-silver-gold",
];

test("glossary is bilingual, leveled, interlinked and keeps every public anchor", () => {
  const entries = glossary.glossaryEntries;
  const ids = entries.map((entry) => entry.id);
  assert.ok(entries.length >= 110, `expected at least 110 terms, got ${entries.length}`);
  assert.equal(new Set(ids).size, ids.length, "duplicate glossary ids");
  for (const id of ORIGINAL_GLOSSARY_IDS) assert.ok(ids.includes(id), `public anchor removed: ${id}`);
  assert.equal(glossary.glossaryCategoryLabels.orquestacion, "Orquestación");
  const levels = new Set(entries.map((entry) => entry.level));
  for (const level of ["fundamentos", "intermedio", "avanzado"]) assert.ok(levels.has(level), `missing level ${level}`);
  for (const entry of entries) {
    assert.ok(glossary.glossaryCategoryLabels[entry.category], `${entry.id}: unknown category`);
    assert.ok(words(entry.definition) >= 8, `${entry.id}: short Spanish definition`);
    assert.ok(words(entry.whyItMatters) >= 7, `${entry.id}: short Spanish whyItMatters`);
    assert.ok(entry.example.trim().length >= 15, `${entry.id}: missing Spanish example`);
    assert.ok(words(entry.en.definition) >= 8, `${entry.id}: short English definition`);
    assert.ok(words(entry.en.whyItMatters) >= 7, `${entry.id}: short English whyItMatters`);
    assert.ok(entry.en.example.trim().length >= 15, `${entry.id}: missing English example`);
    assert.notEqual(entry.en.definition, entry.definition, `${entry.id}: English definition is untranslated`);
    assert.doesNotMatch(entry.en.definition, /is a Databricks .* concept used to reason/u, `${entry.id}: template text`);
    assert.ok(entry.related.length >= 2, `${entry.id}: needs related terms`);
    for (const related of entry.related) {
      assert.ok(ids.includes(related), `${entry.id}: unknown related id ${related}`);
      assert.notEqual(related, entry.id, `${entry.id}: relates to itself`);
    }
    assert.match(entry.sourceUrl, /^(https:\/\/docs\.databricks\.com\/|\/fundamentos#)/u, `${entry.id}: unexpected source`);
    if (entry.sourceUrl.startsWith("/fundamentos#")) {
      const anchor = entry.sourceUrl.slice("/fundamentos#".length);
      assert.ok(foundations.foundationChapters.some((chapter) => chapter.id === anchor), `${entry.id}: unknown chapter ${anchor}`);
    }
  }
});

test("English glossary projection uses editorial text, not templates", () => {
  const source = glossary.glossaryEntries.find((entry) => entry.id === "checkpoint");
  const english = localization.localizeGlossaryEntry(source, "en");
  assert.equal(english.definition, source.en.definition);
  assert.equal(localization.localizeGlossaryEntry(source, "es"), source);
  const translated = localization.localizeGlossaryEntry(glossary.glossaryEntries.find((entry) => entry.id === "table"), "en");
  assert.equal(translated.term, "Table");
  assert.equal(localization.localizeGlossaryCategory("orquestacion", "en"), "Orchestration");
});

test("every lesson opens with bilingual essentials linked to the glossary", () => {
  const lessonIds = course.modules.flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id));
  assert.equal(lessonIds.length, 160);
  assert.deepEqual(Object.keys(essentials.lessonEssentials).sort(), [...lessonIds].sort());
  const glossaryIds = new Set(glossary.glossaryEntries.map((entry) => entry.id));
  for (const courseModule of course.modules) {
    const english = localization.localizeModule(courseModule, "en");
    courseModule.lessons.forEach((lesson, index) => {
      const source = essentials.lessonEssentials[lesson.id];
      assert.ok(source.glossary.length >= 2, `${lesson.id}: needs glossary terms`);
      for (const id of source.glossary) assert.ok(glossaryIds.has(id), `${lesson.id}: unknown glossary id ${id}`);
      for (const locale of ["es", "en"]) {
        const text = source[locale];
        assert.ok(words(text.plain) >= 15, `${lesson.id}/${locale}: plain explanation too short`);
        assert.ok(words(text.analogy) >= 8, `${lesson.id}/${locale}: analogy too short`);
        assert.ok(words(text.buildsOn) >= 6, `${lesson.id}/${locale}: buildsOn too short`);
      }
      assert.notEqual(source.es.plain, source.en.plain, `${lesson.id}: untranslated essentials`);
      assert.equal(lesson.essentials.plain, source.es.plain);
      assert.equal(english.lessons[index].essentials.plain, source.en.plain);
      assert.deepEqual(lesson.essentials.glossary.map((term) => term.id), source.glossary);
    });
  }
});

test("foundations chapters are complete in both languages and point to real modules", () => {
  const chapters = foundations.foundationChapters;
  const moduleIds = new Set(course.modules.map((courseModule) => courseModule.id));
  const glossaryIds = new Set(glossary.glossaryEntries.map((entry) => entry.id));
  assert.ok(chapters.length >= 8);
  assert.equal(new Set(chapters.map((chapter) => chapter.id)).size, chapters.length);
  for (const chapter of chapters) {
    for (const id of chapter.modules) assert.ok(moduleIds.has(id), `${chapter.id}: unknown module ${id}`);
    for (const id of chapter.glossary) assert.ok(glossaryIds.has(id), `${chapter.id}: unknown glossary id ${id}`);
    for (const locale of ["es", "en"]) {
      const text = chapter[locale];
      assert.ok(text.title && text.goal && text.analogy && text.oneLiner, `${chapter.id}/${locale}: missing fields`);
      assert.ok(text.body.length >= 3, `${chapter.id}/${locale}: body too short`);
      assert.ok(words(text.check.question) >= 6 && words(text.check.answer) >= 6, `${chapter.id}/${locale}: weak self-check`);
    }
    assert.notEqual(chapter.es.title, chapter.en.title);
  }
  for (const step of foundations.foundationNextSteps) {
    for (const id of step.modules) assert.ok(moduleIds.has(id), `next step references unknown module ${id}`);
  }
});

test("didactic surfaces are wired into navigation, sitemap and the lesson layout", async () => {
  const [shell, sitemap, course, home, route] = await Promise.all([
    readFile(join(workspace, "app/components/public/PublicShell.tsx"), "utf8"),
    readFile(join(workspace, "app/sitemap.ts"), "utf8"),
    readFile(join(workspace, "app/components/enterprise/CourseWorkspace.tsx"), "utf8"),
    readFile(join(workspace, "app/page.tsx"), "utf8"),
    readFile(join(workspace, "app/ruta/page.tsx"), "utf8"),
  ]);
  assert.match(shell, /href="\/fundamentos"/u);
  assert.match(shell, /href="\/glosario"/u);
  assert.ok(sitemap.includes('entry("/fundamentos"'));
  assert.match(home, /href: "\/fundamentos"/u);
  assert.match(route, /href="\/fundamentos"/u);
  for (const symbol of ["lesson.essentials.plain", "lesson.deepDive.mechanics", "lesson.deepDive.workedScenario", "lesson.examDecision", "lesson.explanation.map", "id={concept.anchor}"]) {
    assert.ok(course.includes(symbol), `CourseWorkspace no longer renders ${symbol}`);
  }
});
