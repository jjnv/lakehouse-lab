import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import test, { after } from "node:test";
import ts from "typescript";

const workspace = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), "lakehouse-bilingual-"));
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

for (const entry of ["app/course-data.ts", "app/i18n/curriculum.ts", "app/i18n/dates.ts", "app/i18n/english-quiz-content.ts", "app/i18n/english-resource-content.ts", "app/curriculum/community-resources.ts", "app/enterprise/curriculum.ts", "app/progress.ts"]) {
  await compileSource(join(workspace, entry));
}

const course = require(join(temporary, "app/course-data.js"));
const localization = require(join(temporary, "app/i18n/curriculum.js"));
const curriculum = require(join(temporary, "app/enterprise/curriculum.js"));
const progress = require(join(temporary, "app/progress.js"));
const dates = require(join(temporary, "app/i18n/dates.js"));
const { englishQuizContent } = require(join(temporary, "app/i18n/english-quiz-content.js"));
const englishResources = require(join(temporary, "app/i18n/english-resource-content.js"));
const community = require(join(temporary, "app/curriculum/community-resources.js"));

after(async () => {
  await rm(temporary, { recursive: true, force: true });
});

test("the 2.1 curriculum keeps stable topology and explicit performance objectives", () => {
  assert.equal(progress.CONTENT_VERSION, "lakehouse-lab-v2.1.0");
  assert.equal(course.modules.length, 32);
  assert.equal(course.modules.reduce((sum, module) => sum + module.minutes, 0), 6000);
  for (const [index, module] of course.modules.entries()) {
    assert.equal(module.id, `m${String(index + 1).padStart(2, "0")}`);
    assert.equal(module.lessons.length, 5);
    assert.match(module.performanceObjective, /^.{40,}$/u, `${module.id} necesita un objetivo observable`);
  }
});

test("English modules preserve canonical identity and real lab checks", () => {
  const allEnglishPrompts = new Set();
  for (const spanish of course.modules) {
    const english = localization.localizeModule(spanish, "en");
    assert.equal(english.id, spanish.id);
    assert.equal(english.slug, spanish.slug);
    assert.deepEqual(english.prerequisites, spanish.prerequisites);
    assert.notEqual(english.performanceObjective, spanish.performanceObjective);
    assert.deepEqual(english.lessons.map((lesson) => lesson.id), spanish.lessons.map((lesson) => lesson.id));
    assert.equal(english.lab.id, spanish.lab.id);
    assert.equal(english.lab.starterCode, spanish.lab.starterCode);
    assert.equal(english.lab.solution, spanish.lab.solution);
    assert.deepEqual(english.lab.checks.map((check) => check.pattern), spanish.lab.checks.map((check) => check.pattern));
    for (const check of english.lab.checks) {
      assert.notEqual(check.pattern.trim(), ".*", `${spanish.id} conserva un check comodín`);
      assert.match(english.lab.solution, new RegExp(check.pattern, "u"), `${spanish.id}: la solución EN no supera ${check.label}`);
    }
    assert.equal(english.quiz.length, spanish.quiz.length);
    for (const [index, question] of english.quiz.entries()) {
      const canonical = spanish.quiz[index];
      assert.equal(question.editorialId, canonical.editorialId);
      assert.equal(question.answer, canonical.answer);
      assert.deepEqual(question.objectiveIds, canonical.objectiveIds);
      assert.deepEqual(question.refIds, canonical.refIds);
      assert.equal(question.scope, canonical.scope);
      assert.notEqual(question.question, canonical.question);
      assert.equal(new Set(question.options).size, 4);
      assert.equal(allEnglishPrompts.has(question.question), false, `Prompt EN duplicado: ${question.question}`);
      allEnglishPrompts.add(question.question);
    }
  }
  assert.equal(allEnglishPrompts.size, 128);
});

test("both simulator projections keep editorial identity, scoring and unique English prompts", () => {
  for (const [mode, expected] of [["associate", 45], ["professional", 59]]) {
    const spanish = course.buildExamQuestions(mode, 1);
    const english = spanish.map((question, index) => localization.localizeQuizQuestion(question, "en", index));
    assert.equal(spanish.length, expected);
    assert.equal(english.length, expected);
    assert.equal(new Set(english.map((question) => question.question)).size, expected);
    for (const [index, question] of english.entries()) {
      const canonical = spanish[index];
      assert.equal(question.editorialId, canonical.editorialId);
      assert.equal(question.answer, canonical.answer);
      assert.equal(question.moduleId, canonical.moduleId);
      assert.notEqual(question.question, canonical.question);
      assert.equal(new Set(question.options).size, 4);
    }
  }
});

test("English search indexes every localized module and lesson", () => {
  const summaries = curriculum.moduleSummaries("en");
  assert.equal(summaries.length, 32);
  for (const summary of summaries) {
    const results = curriculum.searchCurriculum(summary.title, "en", 12);
    assert.ok(results.some((result) => result.id === `module:${summary.id}`), `No encuentra ${summary.id}: ${summary.title}`);
  }
  for (const spanish of course.modules) {
    const english = localization.localizeModule(spanish, "en");
    for (const lesson of english.lessons) {
      const results = curriculum.searchCurriculum(lesson.title, "en", 12);
      assert.ok(results.some((result) => result.id === `lesson:${lesson.id}`), `No encuentra ${lesson.id}: ${lesson.title}`);
    }
  }
});

test("concept anchors remain canonical across locales", () => {
  for (const source of course.modules) {
    const spanish = curriculum.publicModule(source, "es");
    const english = curriculum.publicModule(source, "en");
    for (const [lessonIndex, lesson] of spanish.lessons.entries()) {
      const translated = english.lessons[lessonIndex];
      for (const [conceptIndex, concept] of lesson.deepDive.concepts.entries()) {
        assert.ok(concept.anchor, `${lesson.id} concepto ${conceptIndex + 1} no expone anchor`);
        assert.equal(translated.deepDive.concepts[conceptIndex].anchor, concept.anchor);
      }
    }
  }
});


const SPANISH_MARKERS = /[áéíóúñ¿¡]|\b(?:de|del|los|las|una|sobre|para|según|sin|cuando)\b/iu;

function shapeOf(value) {
  if (Array.isArray(value)) return `[${value.map(shapeOf).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${key}:${shapeOf(value[key])}`).join(",")}}`;
  return typeof value;
}

test("English lessons mirror the Spanish editorial structure field by field", () => {
  for (const spanishModule of course.modules) {
    const englishModule = localization.localizeModule(spanishModule, "en");
    for (const [index, spanish] of spanishModule.lessons.entries()) {
      const english = englishModule.lessons[index];
      for (const field of ["summary", "explanation", "deepDive", "keyPoints", "decisions", "pitfalls", "examDecision", "checkpoint"]) {
        assert.equal(shapeOf(english[field]), shapeOf(spanish[field]), `${spanish.id}.${field} no conserva la estructura`);
        assert.notDeepEqual(english[field], spanish[field], `${spanish.id}.${field} no está traducido`);
      }
      const professionalExtension = /Extensión profesional/u.test(spanish.examDecision);
      assert.equal(/Professional extension/u.test(english.examDecision), professionalExtension, `${spanish.id}: la decisión de examen EN no refleja la extensión profesional`);
    }
  }
});

test("English labs translate every learner-facing field and keep executable content canonical", () => {
  for (const spanishModule of course.modules) {
    const spanish = spanishModule.lab;
    const english = localization.localizeModule(spanishModule, "en").lab;
    assert.equal(english.steps.length, spanish.steps.length);
    assert.equal(english.expectedEvidence.length, spanish.expectedEvidence.length);
    assert.deepEqual(english.refIds, spanish.refIds);
    assert.equal(english.estimatedCost.paid.AWS.replaceAll(".", ","), spanish.estimatedCost.paid.AWS);
    const prose = [
      english.title, english.goal, english.scenario, ...english.steps, ...english.expectedEvidence,
      english.deliberateFailure.scenario, english.deliberateFailure.recovery,
      ...english.checks.map((check) => check.label), ...english.cloudNotes.map((note) => note.note),
      english.freeEdition.note, english.runtime.free, english.environment, english.compute,
      ...english.prerequisites, ...english.permissions, english.dataset.name, english.dataset.acquisition,
      english.reproducibility.note, english.estimatedCost.free, english.estimatedCost.assumptions, english.expectedOutcome,
      ...english.cleanup.slice(1), ...english.troubleshooting.flatMap((item) => [item.symptom, item.fix]), english.reviewedAt,
    ];
    for (const text of prose) {
      assert.doesNotMatch(text, SPANISH_MARKERS, `${spanishModule.id}: texto de laboratorio sin traducir: ${text}`);
    }
    assert.equal(english.cleanup[0], spanish.cleanup[0], "el SQL de limpieza es canónico");
  }
});

test("English assessments translate every item and keep the correct option aligned after shuffling", () => {
  const spanishQuestions = [
    ...course.modules.flatMap((module) => module.quiz),
    ...[1, 2, 3].flatMap((attempt) => [...course.buildExamQuestions("associate", attempt), ...course.buildExamQuestions("professional", attempt)]),
  ];
  for (const spanish of spanishQuestions) {
    const english = localization.localizeQuizQuestion(spanish, "en");
    const copy = englishQuizContent[spanish.editorialId];
    const canonical = course.canonicalQuestionOptions(spanish.editorialId);
    assert.ok(copy && canonical, `${spanish.editorialId} sin traducción`);
    assert.equal(english.answer, spanish.answer);
    assert.equal(english.options[english.answer], copy.options[canonical.indexOf(spanish.options[spanish.answer])]);
    assert.doesNotMatch(english.question, SPANISH_MARKERS, `${spanish.editorialId}: enunciado sin traducir`);
    assert.doesNotMatch(english.explanation, SPANISH_MARKERS, `${spanish.editorialId}: explicación sin traducir`);
    assert.doesNotMatch(english.domain, /Extensión|garantías|recuperación|despliegue/u, `${spanish.editorialId}: dominio sin traducir`);
    if (english.originLabel) assert.doesNotMatch(english.originLabel, SPANISH_MARKERS);
    if (english.sourceLabel) assert.doesNotMatch(english.sourceLabel, SPANISH_MARKERS);
  }
  assert.equal(Object.keys(englishQuizContent).length, 308);
});

test("English community resources use reviewed prose instead of generic placeholders", () => {
  for (const artifact of community.communityArtifacts) {
    const copy = englishResources.englishArtifactFor(artifact.id);
    assert.notEqual(copy.summary, artifact.summary);
    assert.doesNotMatch(`${copy.summary} ${copy.runtimeNotes}`, SPANISH_MARKERS, `${artifact.id} sin traducir`);
  }
  const catalog = curriculum.communityResourceCatalog("en");
  for (const resource of catalog) {
    assert.doesNotMatch(resource.summary, /^Reviewed .* resource for Databricks practice\.$/u);
    for (const text of [resource.summary, resource.runtimeNotes, ...resource.usageInstructions, ...resource.concepts]) {
      assert.doesNotMatch(text, SPANISH_MARKERS, `${resource.id}: ${text}`);
    }
  }
});

test("editorial review dates are localized without inventing values", () => {
  assert.equal(dates.localizeReviewDate("25 ago 2026", "en"), "Aug 25, 2026");
  assert.equal(dates.localizeReviewDate("24 de julio de 2026", "en"), "July 24, 2026");
  assert.equal(dates.localizeReviewDate("25 ago 2026", "es"), "25 ago 2026");
  assert.equal(dates.localizeReviewDate("2026-11-27", "en"), "2026-11-27");
  assert.equal(dates.localizeReviewDate(null, "en"), null);
});
