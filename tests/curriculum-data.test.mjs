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
const [enterpriseStoreSource, learningServiceSource, enterpriseCurriculumSource] = await Promise.all([
  read("app/enterprise/store.ts"),
  read("app/enterprise/learning-service.ts"),
  read("app/enterprise/curriculum.ts"),
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

function wordCount(value) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function variables(ast) {
  const result = new Map();
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) result.set(declaration.name.text, unwrap(declaration.initializer));
    }
  }
  return result;
}

function resolveReference(node, scope) {
  const value = unwrap(node);
  if (ts.isIdentifier(value) && scope.has(value.text)) return resolveReference(scope.get(value.text), scope);
  if (ts.isPropertyAccessExpression(value)) {
    const target = resolveReference(value.expression, scope);
    return resolveReference(property(target, value.name.text), scope);
  }
  if (ts.isElementAccessExpression(value)) {
    const target = resolveReference(value.expression, scope);
    const rawKey = textValue(value.argumentExpression) ?? (ts.isNumericLiteral(value.argumentExpression) ? value.argumentExpression.text : null);
    assert.notEqual(rawKey, null, "El índice de deepDive debe ser literal");
    if (ts.isArrayLiteralExpression(target)) {
      const element = target.elements[Number(rawKey)];
      assert.ok(element, `No existe el índice ${rawKey} de deepDive`);
      return resolveReference(element, scope);
    }
    return resolveReference(property(target, rawKey), scope);
  }
  return value;
}

function deepDiveData(initializer, scope) {
  const deepDive = resolveReference(initializer, scope);
  if (ts.isCallExpression(deepDive)) {
    assert.ok(ts.isIdentifier(deepDive.expression) && ["deepDive", "dive"].includes(deepDive.expression.text), "Constructor deepDive desconocido");
    const [mentalNode, mechanicsNode, conceptsNode, situationNode, reasoningNode, outcomeNode] = deepDive.arguments.map(unwrap);
    assert.ok(ts.isArrayLiteralExpression(mechanicsNode) && ts.isArrayLiteralExpression(conceptsNode) && ts.isArrayLiteralExpression(reasoningNode));
    const concepts = conceptsNode.elements.map((conceptNode) => {
      const concept = unwrap(conceptNode);
      if (ts.isCallExpression(concept)) return concept.arguments.map(textValue);
      if (ts.isArrayLiteralExpression(concept)) return concept.elements.map(textValue);
      assert.ok(ts.isObjectLiteralExpression(concept));
      return [textProperty(concept, "term"), textProperty(concept, "definition"), textProperty(concept, "whyItMatters")];
    });
    return {
      mentalModel: textValue(mentalNode),
      mechanics: mechanicsNode.elements.map(textValue),
      concepts,
      situation: textValue(situationNode),
      reasoning: reasoningNode.elements.map(textValue),
      outcome: textValue(outcomeNode),
    };
  }
  assert.ok(ts.isObjectLiteralExpression(deepDive), "deepDive debe resolverse a un objeto o constructor tipado");
  const workedScenario = object(deepDive, "workedScenario");
  return {
    mentalModel: textProperty(deepDive, "mentalModel"),
    mechanics: array(deepDive, "mechanics").map(textValue),
    concepts: array(deepDive, "concepts").map((node) => {
      const concept = unwrap(node);
      return [textProperty(concept, "term"), textProperty(concept, "definition"), textProperty(concept, "whyItMatters")];
    }),
    situation: textProperty(workedScenario, "situation"),
    reasoning: array(workedScenario, "reasoning").map(textValue),
    outcome: textProperty(workedScenario, "outcome"),
  };
}

function contentPackEntries(source, variableName, filename, coreDeepDives = false) {
  const ast = parse(source, filename);
  const rootObject = variableInitializer(ast, variableName);
  const scope = variables(ast);
  assert.ok(ts.isObjectLiteralExpression(rootObject), `${variableName} debe ser un objeto`);
  return rootObject.properties.map((item) => {
    assert.ok(ts.isPropertyAssignment(item), "Cada módulo debe ser una propiedad");
    const value = unwrap(item.initializer);
    assert.ok(ts.isObjectLiteralExpression(value), `${nameOf(item.name)} debe ser un objeto`);
    const id = nameOf(item.name);
    let fallbackDeepDives = null;
    if (coreDeepDives) {
      const number = Number(id.slice(1));
      const registryName = number <= 4 ? "deepDives01To04" : number <= 8 ? "deepDives05To08" : "deepDives09To12";
      const registry = variableInitializer(ast, registryName);
      fallbackDeepDives = property(registry, id);
      assert.ok(ts.isArrayLiteralExpression(fallbackDeepDives), `${id}: faltan deep dives del tronco`);
    }
    return [id, value, scope, fallbackDeepDives];
  });
}

const packEntries = [
  ...contentPackEntries(contentSources[0], "coreBase", "core-content.ts", true),
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

test("uses current Databricks terminology without generic depth padding", () => {
  const authoredContent = [courseSource, ...contentSources].join("\n");
  assert.match(authoredContent, /Spark Declarative Pipelines en Lakeflow/);
  assert.match(authoredContent, /AUTO CDC/);
  assert.match(authoredContent, /Declarative Automation Bundles/);
  assert.doesNotMatch(authoredContent, /Lakeflow Spark Declarative Pipelines/);
  assert.doesNotMatch(authoredContent, /En esta lección, ese alcance explica que/);
  assert.doesNotMatch(authoredContent, /Su efecto se comprueba en los límites, fallos y decisiones/);
});

test("all 32 authored packs contain complete lessons, practice, assessment and official sources", () => {
  assert.equal(packEntries.length, 32);
  assert.deepEqual(packEntries.map(([id]) => id), Array.from({ length: 32 }, (_, index) => `m${String(index + 1).padStart(2, "0")}`));
  const quizQuestions = new Set();
  let deepDiveCount = 0;
  let deepDiveWords = 0;
  const depthIssues = [];

  for (const [id, pack, scope, fallbackDeepDives] of packEntries) {
    const lessons = array(pack, "lessons");
    assert.equal(lessons.length, 5, `${id} debe tener cinco lecciones`);
    for (const [lessonIndex, lessonNode] of lessons.entries()) {
      const lesson = unwrap(lessonNode);
      assert.ok(textProperty(lesson, "summary").length >= 50, `${id}: resumen insuficiente`);
      const explanation = array(lesson, "explanation").map(textValue);
      assert.equal(explanation.length, 2, `${id}: explicación incompleta`);
      assert.ok(explanation.every((paragraph) => paragraph && paragraph.length >= 40), `${id}: párrafos demasiado breves`);
      const directDeepDive = lesson.properties.find((item) => ts.isPropertyAssignment(item) && nameOf(item.name) === "deepDive");
      const deepDiveInitializer = directDeepDive && ts.isPropertyAssignment(directDeepDive)
        ? directDeepDive.initializer
        : fallbackDeepDives?.elements[lessonIndex];
      assert.ok(deepDiveInitializer, `${id}: falta deepDive en la lección ${lessonIndex + 1}`);
      const deepDive = deepDiveData(deepDiveInitializer, scope);
      const mentalModel = deepDive.mentalModel;
      assert.equal(typeof mentalModel, "string", `${id}: el modelo mental debe ser texto literal`);
      if (wordCount(mentalModel) < 85) depthIssues.push(`${id}.${lessonIndex + 1}: modelo mental ${wordCount(mentalModel)}/85`);
      const mechanics = deepDive.mechanics;
      assert.equal(mechanics.length, 2, `${id}: mecánica incompleta`);
      mechanics.forEach((paragraph, index) => {
        if (!paragraph || wordCount(paragraph) < 60) depthIssues.push(`${id}.${lessonIndex + 1}: mecánica ${index + 1} ${wordCount(paragraph ?? "")}/60`);
      });
      const concepts = deepDive.concepts;
      assert.equal(concepts.length, 3, `${id}: deben existir tres conceptos definidos`);
      const conceptTexts = [];
      for (const [term, definition, whyItMatters] of concepts) {
        assert.ok([term, definition, whyItMatters].every((value) => typeof value === "string"), `${id}: concepto no literal`);
        assert.ok(term.length >= 3);
        if (wordCount(definition) < 8) depthIssues.push(`${id}.${lessonIndex + 1} «${term}»: definición ${wordCount(definition)}/8`);
        if (wordCount(whyItMatters) < 7) depthIssues.push(`${id}.${lessonIndex + 1} «${term}»: relevancia ${wordCount(whyItMatters)}/7`);
        conceptTexts.push(term, definition, whyItMatters);
      }
      const situation = deepDive.situation;
      assert.equal(typeof situation, "string", `${id}: la situación debe ser texto literal`);
      if (wordCount(situation) < 12) depthIssues.push(`${id}.${lessonIndex + 1}: situación ${wordCount(situation)}/12`);
      const reasoning = deepDive.reasoning;
      assert.equal(reasoning.length, 3);
      reasoning.forEach((step, index) => {
        if (!step || wordCount(step) < 11) depthIssues.push(`${id}.${lessonIndex + 1}: razonamiento ${index + 1} ${wordCount(step ?? "")}/11`);
      });
      const outcome = deepDive.outcome;
      assert.equal(typeof outcome, "string", `${id}: el resultado debe ser texto literal`);
      if (wordCount(outcome) < 14) depthIssues.push(`${id}.${lessonIndex + 1}: resultado ${wordCount(outcome)}/14`);
      deepDiveCount += 1;
      const lessonDeepDiveWords = [mentalModel, ...mechanics, ...conceptTexts, situation, ...reasoning, outcome]
        .reduce((total, value) => total + wordCount(value ?? ""), 0);
      if (lessonDeepDiveWords < 350) depthIssues.push(`${id}.${lessonIndex + 1}: desarrollo agregado ${lessonDeepDiveWords}/350`);
      deepDiveWords += lessonDeepDiveWords;
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
  assert.equal(deepDiveCount, 160);
  assert.deepEqual(depthIssues, [], `Profundidad conceptual insuficiente:\n${depthIssues.join("\n")}`);
  assert.ok(deepDiveWords >= 65_000, `Profundidad conceptual agregada insuficiente: ${deepDiveWords} palabras`);
  assert.equal(quizQuestions.size, 128);
});

test("lesson explanations have a single visible source of truth", async () => {
  const [courseWorkspace, catalogWorkspace] = await Promise.all([
    read("app/components/enterprise/CourseWorkspace.tsx"),
    read("app/components/enterprise/CatalogWorkspace.tsx"),
  ]);

  assert.doesNotMatch(courseSource, /detail:\s*content\.explanation\.join/u);
  assert.doesNotMatch(courseWorkspace, /lesson\.detail/u);
  assert.match(courseWorkspace, /lesson\.explanation\.map/u);
  assert.doesNotMatch(catalogWorkspace, /<h2[^>]*>Catálogo<\/h2>/u);
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
  const associate = examBank(associateSource, "associateExamBank", 50);
  const professional = examBank(professionalSource, "professionalExamBank", 64);
  assert.ok((associateSource.match(/sourceUrl:/g) ?? []).length >= 5, "Associate: las preguntas nuevas necesitan referencias oficiales");
  assert.ok((professionalSource.match(/sourceUrl:/g) ?? []).length >= 5, "Professional: las preguntas nuevas necesitan referencias oficiales");
  assert.match(courseSource, /slice\(0, itemCount\)/, "cada intento debe conservar el número oficial de preguntas");
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

test("dependency and enterprise completion gates cannot be bypassed by stale state", () => {
  assert.match(courseSource, /if \(track === "core"\) return \[seeds\[index - 1\]\.id\]/);
  assert.match(courseSource, /previous\.track === track \? \[previous\.id\] : \["m12"\]/);
  assert.match(courseSource, /return \["m17", "m22", "m27", "m31"\]/);
  assert.match(progressSource, /STORAGE_KEY = "lakehouse-lab-progress-v2"/);
  assert.match(progressSource, /CONTENT_VERSION = "lakehouse-lab-v2\.0\.0"/);
  assert.match(progressSource, /export function sanitizeProgress\(value: unknown\)/);
  assert.match(progressSource, /gamification: sanitizeGamification\(value\.gamification\)/);

  assert.match(enterpriseStoreSource, /minimumModuleQuizPercent: 75/);
  assert.match(enterpriseStoreSource, /minimumFinalAssessmentPercent: 80/);
  assert.match(enterpriseStoreSource, /requireLabs: true/);
  assert.match(enterpriseStoreSource, /requireCapstone: true/);
  assert.match(learningServiceSource, /async function assertAssessmentAvailable/);
  assert.match(learningServiceSource, /"MODULE_ACTIVITY_REQUIRED"/);
  assert.match(learningServiceSource, /"PROGRAM_ACTIVITY_REQUIRED"/);
  assert.match(learningServiceSource, /completedLessonIds\.length !== curriculumModule\.lessons\.length \|\| !moduleProgress\.labAttested/);
  assert.match(learningServiceSource, /professionalAttempt\.kind !== "professional_exam"/);
  assert.match(learningServiceSource, /professionalAttempt\.provenance !== "server_graded"/);
  assert.match(learningServiceSource, /if \(!progress\.every\(\(item\) => item\.completed\)\) return null/);

  const publicQuizStart = enterpriseCurriculumSource.indexOf("quiz: module.quiz.map");
  const publicQuizEnd = enterpriseCurriculumSource.indexOf("\n    })),", publicQuizStart);
  assert.ok(publicQuizStart >= 0 && publicQuizEnd > publicQuizStart, "falta la proyecciÃ³n pÃºblica del test");
  const publicQuizProjection = enterpriseCurriculumSource.slice(publicQuizStart, publicQuizEnd);
  assert.doesNotMatch(publicQuizProjection, /\banswer\s*:|\bexplanation\s*:/);
  assert.match(pageSource, /getSessionUser\(\)/);
  assert.match(pageSource, /href="\/ruta"/);
  assert.match(pageSource, /sampleLessonHref/);
  assert.doesNotMatch(pageSource, /href="\/demo"/);
  assert.doesNotMatch(courseSource, /function makeQuiz/);
});

test("the normal test command runs every validation suite", () => {
  const packageJson = JSON.parse(packageSource);
  assert.match(packageJson.scripts.test, /tests\/\*\.test\.mjs/);
});
