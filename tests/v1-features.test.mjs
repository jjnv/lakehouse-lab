import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [course, editorial, game, page, progress, layout, packageSource] = await Promise.all([
  read("app/course-data.ts"),
  read("app/editorial-data.ts"),
  read("app/gamification.ts"),
  read("app/page.tsx"),
  read("app/progress.ts"),
  read("app/layout.tsx"),
  read("package.json"),
]);

test("publishes an auditable 1.0.0 editorial record and current official blueprints", () => {
  assert.match(editorial, /SITE_VERSION = "1\.0\.0"/);
  assert.match(editorial, /may-4-2026\.pdf/);
  assert.match(editorial, /professional-september-2025-exam-guide\.pdf/);
  assert.match(page, /Revisión trimestral/);
  assert.match(page, /cobertura del curso, no pesos oficiales del examen/);
  assert.equal(JSON.parse(packageSource).version, "1.0.0");
  assert.match(layout, /og-v1\.png/);
});

test("maps every blueprint objective to theory, practice, assessment and modules", () => {
  const objectiveCalls = [...editorial.matchAll(/objective\("([^"]+)",\s*"(Associate|Professional)"/g)];
  assert.equal(objectiveCalls.filter((match) => match[2] === "Associate").length, 33);
  assert.equal(objectiveCalls.filter((match) => match[2] === "Professional").length, 45);
  const mappedCalls = [...editorial.matchAll(/objective\([^\n]+\["m\d{2}"/g)];
  assert.equal(mappedCalls.length, objectiveCalls.length);
  assert.match(editorial, /theory: true, practice: true, assessment: true/);
  assert.match(page, /cobertura teórica/i);
  assert.match(page, /cobertura práctica/i);
  assert.match(page, /cobertura evaluada/i);
  assert.match(page, /Abrir \$\{target === "lessons" \? "lecciones"/);
});

test("gives every lesson source ids and every lab a versioned operating spec", () => {
  assert.match(course, /const refIds = pack\.sources\.map/);
  assert.match(course, /\n\s+refIds,/);
  assert.match(course, /id: `LAB-\$\{seed\.id\.slice\(1\)\}`/);
  for (const field of ["version", "reviewedAt", "freeEdition", "runtime", "prerequisites", "estimatedCost", "expectedOutcome", "cleanup", "troubleshooting", "refIds"]) {
    assert.match(course, new RegExp(`${field}:`), `missing lab field ${field}`);
  }
  assert.match(page, /Ficha versionada del laboratorio/);
  assert.match(page, /Límites de Free Edition/);
});

test("preview mode cannot write progress, submit tests or reveal solutions", () => {
  assert.match(page, /if \(previewMode\) return;/);
  assert.match(page, /disabled=\{preview\}/);
  assert.match(page, /Explora sin alterar tu progreso/);
  assert.match(page, /respuestas, soluciones, XP y controles de finalización permanecen desactivados/);
  assert.match(page, /const preview = !isUnlocked\(module\)/);
  assert.match(page, /if \(!preview\) updateProgress/);
});

test("gamification uses persistent unique rewards, combos, streaks and nine levels", () => {
  assert.equal((game.match(/\{ name: "/g) ?? []).length, 9);
  assert.match(game, /Lakehouse Architect.*10_000/);
  assert.match(game, /earnedRewardIds/);
  assert.match(game, /alreadyEarned\.has\(reward\.id\)/);
  assert.match(game, /\[\[3, 10\], \[5, 20\], \[7, 40\]\]/);
  assert.match(game, /dayDifference\(previousDate, today\) === 1/);
  assert.match(progress, /sanitizeGamification/);
});
