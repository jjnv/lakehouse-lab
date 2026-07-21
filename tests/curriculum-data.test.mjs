import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/course-data.ts", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("contains exactly 32 ordered and unique modules", () => {
  const ids = [...source.matchAll(/\{ id:"(m\d{2})"/g)].map((match) => match[1]);
  assert.equal(ids.length, 32);
  assert.equal(new Set(ids).size, 32);
  assert.deepEqual(ids, Array.from({ length: 32 }, (_, index) => `m${String(index + 1).padStart(2, "0")}`));
});

test("curriculum totals exactly 100 hours and every module has five topics", () => {
  const minutes = [...source.matchAll(/\bminutes:(\d+)/g)].map((match) => Number(match[1]));
  assert.equal(minutes.length, 32);
  assert.equal(minutes.reduce((sum, value) => sum + value, 0), 6000);
  const topicLists = [...source.matchAll(/\btopics:\[([^\]]+)\]/g)];
  assert.equal(topicLists.length, 32);
  for (const [, list] of topicLists) assert.equal((list.match(/"/g) ?? []).length / 2, 5);
});

test("final convergence requires the four branch endpoints", () => {
  assert.match(source, /return \["m17", "m22", "m27", "m31"\]/);
  assert.match(pageSource, /lakehouse-lab-progress-v2/);
});
