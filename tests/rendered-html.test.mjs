import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the finished academy metadata and core content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview/i);
  assert.match(html, /Lakehouse Lab v1\.7\.0/i);
  assert.match(html, /32 módulos/i);
  assert.match(html, /Explicaci\u00f3n guiada, paso a paso/i);
  assert.match(html, /Construiremos el tema por capas/i);
  assert.match(html, /Modelo mental/i);
  assert.match(html, /Continúa donde lo dejaste/i);
  assert.match(html, /Recuerdo activo/i);
  assert.match(html, />Aprender<\/a>/i);
  assert.match(html, />Ruta<\/a>/i);
  assert.match(html, />Recursos<\/a>/i);
  assert.doesNotMatch(html, /Elige cuánto necesitas recorrer/i);
  assert.doesNotMatch(html, /Método, blueprint y revisión/i);
});
