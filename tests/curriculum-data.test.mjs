import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [courseSource, progressSource, pageSource, packageSource, ...contentSources] = await Promise.all([
  read("app/course-data.ts"),
  read("app/progress.ts"),
  read("app/page.tsx"),
  read("package.json"),
  read("app/curriculum/core-content.ts"),
  read("app/curriculum/advanced-content-a.ts"),
  read("app/curriculum/advanced-content-b.ts"),
]);

function parse(source, name) {
  return ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function unwrap(node) {
  let current = node;
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) current = current.expression;
  return current;
}

function variableInitializer(ast, name) {
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) return unwrap(declaration.initializer);
    }
  }
  assert.fail(`No se encontró la variable ${name}`);
}

function nameOf(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return node.text;
  return node.getText();
}

function property(object, name) {
  assert.ok(ts.isObjectLiteralExpression(object), `${name} debe pertenecer a un objeto`);
  const match = object.properties.find((item) => ts.isPropertyAssignment(item) && nameOf(item.name) === name);
  assert.ok(match && ts.isPropertyAssignment(match), `Falta la propiedad ${name}`);
  return unwrap(match.initializer);
}

function array(object, name) {
  const value = property(object, name);
  assert.ok(ts.isArrayLiteralExpression(value), `${name} debe ser una lista`);
  return [...value.elements];
}

function object(object, name) {
  const value = property(object, name);
  assert.ok(ts.isObjectLiteralExpression(value), `${name} debe ser un objeto`);
  return value;
}

function textValue(node) {
  const value = unwrap(node);
  return ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value) ? value.text : null;
}

function textProperty(object, name) {
  const value = textValue(property(object, name));
  assert.equal(typeof value, "string", `${name} debe ser texto literal`);
  return value;
}

function numberProperty(object, name) {
  const value = property(object, name);
  assert.ok(ts.isNumericLiteral(value), `${name} debe ser numérico`);
  return Number(value.text);
}

function contentPackEntries(source, variableName, filename) {
  const rootObject = variableInitializer(parse(source, filename), variableName);
  assert.ok(ts.isObjectLiteralExpression(rootObject), `${variableName} debe ser un objeto`);
  return rootObject.properties.map((item) => {
    assert.ok(ts.isPropertyAssignment(item), "Cada módulo debe ser una propiedad");
    const value = unwrap(item.initializer);
    assert.ok(ts.isObjectLiteralExpression(value), `${nameOf(item.name)} debe ser un objeto`);
    return [nameOf(item.name), value];
  });
}

const packEntries = [
  ...contentPackEntries(contentSources[0], "coreContent", "core-content.ts"),
  ...contentPackEntries(contentSources[1], "advancedContentA", "advanced-content-a.ts"),
  ...contentPackEntries(contentSources[2], "advancedContentB", "advanced-content-b.ts"),
];

test("contains exactly 32 ordered, unique modules and 100 hours", () => {
  const ast = parse(courseSource, "course-data.ts");
  const seeds = variableInitializer(ast, "seeds");
  assert.ok(ts.isArrayLiteralExpression(seeds));
  const modules = seeds.elements.map(unwrap);
  assert.equal(modules.length, 32);
  const ids = modules.map((module) => textProperty(module, "id"));
  assert.deepEqual(ids, Array.from({ length: 32 }, (_, index) => `m${String(index + 1).padStart(2, "0")}`));
  assert.equal(new Set(ids).size, 32);
  assert.equal(modules.reduce((sum, module) => sum + numberProperty(module, "minutes"), 0), 6000);
  for (const seed of modules) assert.equal(array(seed, "topics").length, 5);
});

test("all 32 authored packs contain complete lessons, practice, assessment and official sources", () => {
  assert.equal(packEntries.length, 32);
  assert.deepEqual(packEntries.map(([id]) => id), Array.from({ length: 32 }, (_, index) => `m${String(index + 1).padStart(2, "0")}`));
  const quizQuestions = new Set();

  for (const [id, pack] of packEntries) {
    const lessons = array(pack, "lessons");
    assert.equal(lessons.length, 5, `${id} debe tener cinco lecciones`);
    for (const lessonNode of lessons) {
      const lesson = unwrap(lessonNode);
      assert.ok(textProperty(lesson, "summary").length >= 50, `${id}: resumen insuficiente`);
      const explanation = array(lesson, "explanation").map(textValue);
      assert.equal(explanation.length, 2, `${id}: explicación incompleta`);
      assert.ok(explanation.every((paragraph) => paragraph && paragraph.length >= 40), `${id}: párrafos demasiado breves`);
      assert.equal(array(lesson, "keyPoints").length, 3);
      const example = object(lesson, "example");
      assert.ok(textProperty(example, "code").length >= 12, `${id}: falta ejemplo ejecutable`);
      assert.equal(array(lesson, "pitfalls").length, 2);
      assert.ok(textProperty(lesson, "examDecision").length >= 35);
      const checkpoint = object(lesson, "checkpoint");
      assert.ok(textProperty(checkpoint, "question").length >= 20);
      assert.ok(textProperty(checkpoint, "answer").length >= 8);
    }

    const lab = object(pack, "lab");
    assert.ok(textProperty(lab, "scenario").length >= 45, `${id}: escenario de laboratorio insuficiente`);
    assert.ok(array(lab, "steps").length >= 4, `${id}: el laboratorio necesita al menos cuatro pasos`);
    assert.ok(textProperty(lab, "starterCode").length >= 10);
    const referenceSolution = textProperty(lab, "solution");
    assert.ok(referenceSolution.length >= 25);
    const checks = array(lab, "checks");
    assert.ok(checks.length >= 2);
    for (const checkNode of checks) {
      const check = unwrap(checkNode);
      const checkPattern = new RegExp(textProperty(check, "pattern"), "i");
      assert.ok(checkPattern.test(referenceSolution), `${id}: la solución no supera la comprobación ${textProperty(check, "label")}`);
    }
    assert.ok(array(lab, "expectedEvidence").length >= 3);
    const clouds = object(lab, "cloudNotes");
    assert.deepEqual(clouds.properties.map((item) => nameOf(item.name)).sort(), ["AWS", "Azure", "GCP"]);

    const quiz = array(pack, "quiz");
    assert.equal(quiz.length, 4, `${id} debe tener cuatro preguntas`);
    for (const quizNode of quiz) {
      const question = unwrap(quizNode);
      const prompt = textProperty(question, "question");
      assert.ok(prompt.length >= 20, `${id}: pregunta demasiado breve: ${prompt}`);
      assert.ok(!quizQuestions.has(prompt), `Pregunta duplicada: ${prompt}`);
      quizQuestions.add(prompt);
      const options = array(question, "options").map(textValue);
      assert.equal(options.length, 4);
      assert.equal(new Set(options).size, 4);
      assert.ok(numberProperty(question, "answer") >= 0 && numberProperty(question, "answer") <= 3);
      assert.ok(textProperty(question, "explanation").length >= 30);
      assert.ok(textProperty(question, "domain").length >= 3);
    }

    const sources = array(pack, "sources");
    assert.ok(sources.length >= 2, `${id} necesita al menos dos fuentes`);
    const sourceUrls = new Set();
    for (const sourceNode of sources) {
      const source = unwrap(sourceNode);
      let href;
      if (ts.isCallExpression(source)) href = textValue(source.arguments[1]);
      else if (ts.isObjectLiteralExpression(source)) href = textProperty(source, "href");
      assert.match(href ?? "", /^https:\/\/(?:(?:docs|www)\.)?databricks\.com\//, `${id}: fuente no oficial`);
      assert.ok(!sourceUrls.has(href), `${id}: fuente duplicada ${href}`);
      sourceUrls.add(href);
    }
  }
  assert.equal(quizQuestions.size, 128);
});

function examBank(source, variableName, expectedCount) {
  const bank = variableInitializer(parse(source, `${variableName}.ts`), variableName);
  assert.ok(ts.isArrayLiteralExpression(bank));
  assert.equal(bank.elements.length, expectedCount);
  return bank.elements.map(unwrap);
}

test("simulation banks are independent, original and cover their certification domains", async () => {
  const [associateSource, professionalSource] = await Promise.all([
    read("app/curriculum/associate-exam-bank.ts"),
    read("app/curriculum/professional-exam-bank.ts"),
  ]);
  const associate = examBank(associateSource, "associateExamBank", 45);
  const professional = examBank(professionalSource, "professionalExamBank", 59);
  const modulePrompts = new Set(packEntries.flatMap(([, pack]) => array(pack, "quiz").map((item) => textProperty(unwrap(item), "question"))));

  for (const [name, questions] of [["Associate", associate], ["Professional", professional]]) {
    const prompts = new Set();
    const domains = new Set();
    const answerPositions = new Set();
    for (const question of questions) {
      const prompt = textProperty(question, "question");
      assert.ok(!modulePrompts.has(prompt), `${name}: el simulacro reutiliza un test de módulo`);
      assert.ok(!prompts.has(prompt), `${name}: pregunta duplicada`);
      prompts.add(prompt);
      domains.add(textProperty(question, "domain"));
      const options = array(question, "options").map(textValue);
      assert.equal(options.length, 4);
      assert.equal(new Set(options).size, 4);
      const answer = numberProperty(question, "answer");
      assert.ok(answer >= 0 && answer <= 3);
      answerPositions.add(answer);
      assert.ok(textProperty(question, "explanation").length >= 30);
      assert.match(textProperty(question, "moduleId"), /^m\d{2}$/);
    }
    assert.equal(prompts.size, questions.length);
    assert.deepEqual([...answerPositions].sort(), [0, 1, 2, 3]);
    assert.ok(domains.size >= (name === "Associate" ? 7 : 9), `${name}: cobertura de dominios insuficiente`);
  }
});

test("dependency, progress and assessment gates cannot be bypassed by stale state", () => {
  assert.match(courseSource, /if \(track === "core"\) return \[seeds\[index - 1\]\.id\]/);
  assert.match(courseSource, /previous\.track === track \? \[previous\.id\] : \["m12"\]/);
  assert.match(courseSource, /return \["m17", "m22", "m27", "m31"\]/);
  assert.match(progressSource, /STORAGE_KEY = "lakehouse-lab-progress-v2"/);
  assert.match(progressSource, /CONTENT_VERSION = "academy-32-2026-07-r2"/);
  assert.match(progressSource, /value\.contentVersion !== CONTENT_VERSION/);
  assert.match(progressSource, /progress\.examCompleted\.associate === true/);
  assert.match(progressSource, /progress\.examCompleted\.professional === true/);
  assert.match(progressSource, /progress\.labsPassed\.includes\(module\.id\) && progress\.labConfirmed\.includes\(module\.id\)/);
  assert.match(pageSource, /labConfirmed: current\.labConfirmed\.filter\(\(id\) => id !== activeModule\.id\)/);
  assert.match(pageSource, /moduleIsUnlocked\(deepLinked, currentCompleted\)/);
  assert.match(pageSource, /onSubmit\(percent, completedAttempt\)/);
  assert.doesNotMatch(courseSource, /function makeQuiz/);
});

test("the normal test command runs every validation suite", () => {
  const packageJson = JSON.parse(packageSource);
  assert.match(packageJson.scripts.test, /tests\/\*\.test\.mjs/);
});
