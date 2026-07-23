import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const assetsUrl = new URL(".next/static/", root);
const serverUrl = new URL(".next/server/", root);
const assetNames = await readdir(assetsUrl, { recursive: true });
const serverNames = await readdir(serverUrl, { recursive: true });
const javascriptAssets = assetNames.filter((name) => name.endsWith(".js"));
const stylesheetAssets = assetNames.filter((name) => name.endsWith(".css"));
const serverAssets = serverNames.filter((name) => name.endsWith(".js"));
const assetUrl = (name) => new URL(name.replaceAll("\\", "/"), assetsUrl);
const serverAssetUrl = (name) => new URL(name.replaceAll("\\", "/"), serverUrl);

const clientJavaScript = (await Promise.all(
  javascriptAssets.map((name) => readFile(assetUrl(name), "utf8")),
)).join("\n");
const clientStyles = (await Promise.all(
  stylesheetAssets.map((name) => readFile(assetUrl(name), "utf8")),
)).join("\n");
const serverJavaScript = (await Promise.all(
  serverAssets.map((name) => readFile(serverAssetUrl(name), "utf8")),
)).join("\n");

test("the compiled v2 client contains the real-route enterprise shell", () => {
  assert.ok(javascriptAssets.length > 0, "the production build must emit client JavaScript");
  assert.ok(stylesheetAssets.length > 0, "the production build must emit client styles");
  for (const route of ["/inicio", "/mi-aprendizaje", "/catalogo", "/expediente", "/ajustes"]) {
    assert.ok(clientJavaScript.includes(route), `compiled navigation is missing ${route}`);
  }
  for (const contract of ["Proyecto educativo", "Saltar al contenido", "main-content", "aria-current", "aria-modal"]) {
    assert.ok(clientJavaScript.includes(contract), `compiled shell is missing ${contract}`);
  }
  assert.doesNotMatch(clientJavaScript, /codex-preview/iu);
});

test("the compiled client does not contain server-only curriculum banks or answer keys", () => {
  for (const privateIdentifier of [
    "answerKeyJson",
    "assessment-private",
    "associateExamBank",
    "professionalExamBank",
    "buildExamQuestions",
    "course-data",
  ]) {
    assert.ok(!clientJavaScript.includes(privateIdentifier), `client bundle exposes ${privateIdentifier}`);
  }

  // These sentinels prove the private material still exists in the trusted
  // server artifact, so the negative client assertions are meaningful.
  assert.ok(serverJavaScript.includes("answerKeyJson"));
  assert.ok(serverJavaScript.includes("PDFDocument"));
  assert.ok(serverJavaScript.includes("legacyImports"));
});

test("the compiled UI retains keyboard, announcement and high-contrast affordances", () => {
  for (const semanticContract of ["tablist", "tabpanel", "progressbar", "aria-live", "ArrowRight", "Escape"]) {
    assert.ok(clientJavaScript.includes(semanticContract), `compiled interaction is missing ${semanticContract}`);
  }
  assert.match(clientStyles, /\.ent-shell\{/u);
  assert.match(clientStyles, /\.ent-skip-link/u);
  assert.match(clientStyles, /:focus-visible/u);
  assert.match(clientStyles, /min-height:\s*44px/u);
  assert.match(clientStyles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.match(clientStyles, /@media\s*\(forced-colors:\s*active\)/u);
  assert.match(clientStyles, /@media\s*\((?:max-width:\s*700px|width<=700px)\)/u);
});

test("the server bundle contains the complete public launch surface", () => {
  for (const contract of [
    "Beta pública",
    "Explorar la demo",
    "Tu progreso te pertenece",
    "Condiciones de uso",
    "Proyecto educativo independiente",
    "og-public.png",
  ]) {
    assert.ok(serverJavaScript.includes(contract), `public launch surface is missing ${contract}`);
  }
});
