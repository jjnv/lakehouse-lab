import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

function transpile(path) {
  return ts.transpileModule(read(path), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: path,
  }).outputText;
}

function evaluateCommonJs(code, mocks = {}) {
  const commonJsModule = { exports: {} };
  const context = {
    module: commonJsModule,
    exports: commonJsModule.exports,
    require(specifier) {
      if (specifier in mocks) return mocks[specifier];
      throw new Error(`Unexpected test import: ${specifier}`);
    },
    AbortSignal,
    DOMException,
    Headers,
    Response,
    TextDecoder,
    Uint8Array,
    URL,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(code, context, { filename: "transpiled-community-module.cjs" });
  return commonJsModule.exports;
}

const registry = evaluateCommonJs(transpile("app/curriculum/community-resources.ts"));

test("the community registry keeps 22 repositories and exactly three recommendations per module", () => {
  assert.equal(registry.communityRepositories.length, 22);
  assert.equal(registry.moduleResourceRecommendations.length, 96);
  const byModule = new Map();
  for (const recommendation of registry.moduleResourceRecommendations) {
    const current = byModule.get(recommendation.moduleId) ?? [];
    current.push(recommendation);
    byModule.set(recommendation.moduleId, current);
  }
  assert.equal(byModule.size, 32);
  for (let index = 1; index <= 32; index += 1) {
    const moduleId = `m${String(index).padStart(2, "0")}`;
    const recommendations = byModule.get(moduleId);
    assert.equal(recommendations?.length, 3, `${moduleId} must have three recommendations`);
    assert.equal(recommendations.map((item) => item.rank).join(","), "1,2,3");
    assert.equal(recommendations.filter((item) => item.preferred).length, 1);
  }
});

test("preview-enabled artifacts are pinned, allowlisted and licensed", () => {
  const repositories = new Map(registry.communityRepositories.map((repository) => [repository.id, repository]));
  const previewable = registry.communityArtifacts.filter((artifact) => artifact.preview);
  assert.ok(previewable.length >= 8);
  for (const artifact of previewable) {
    assert.equal(repositories.get(artifact.repositoryId)?.licenseStatus, "verified");
    assert.match(artifact.preview.upstreamRef, /^[a-f0-9]{40}$/);
    assert.match(artifact.preview.rawUrl, /^https:\/\/raw\.githubusercontent\.com\//);
    assert.ok(artifact.preview.path);
  }
});

function loadPreviewModule(resolved, fetchImpl) {
  const code = transpile("app/enterprise/notebook-preview.ts");
  const commonJsModule = { exports: {} };
  const context = {
    module: commonJsModule,
    exports: commonJsModule.exports,
    require(specifier) {
      if (specifier === "../curriculum/community-resources") return { findCommunityArtifact: () => resolved };
      if (specifier === "./contracts") return {};
      throw new Error(`Unexpected test import: ${specifier}`);
    },
    fetch: fetchImpl,
    AbortSignal,
    DOMException,
    Headers,
    Response,
    TextDecoder,
    Uint8Array,
    console,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(code, context, { filename: "transpiled-notebook-preview.cjs" });
  return commonJsModule.exports;
}

const resolvedPreview = {
  artifact: {
    id: "safe-notebook",
    title: "Safe notebook",
    href: "https://github.com/example/repo/blob/commit/notebook.ipynb",
    languages: ["Python"],
    preview: {
      kind: "ipynb",
      rawUrl: "https://raw.githubusercontent.com/example/repo/1234567890123456789012345678901234567890/notebook.ipynb",
      upstreamRef: "1234567890123456789012345678901234567890",
      path: "notebook.ipynb",
    },
  },
  repository: {
    url: "https://github.com/example/repo",
    licenseStatus: "verified",
    reviewedAt: "23 jul 2026",
  },
};

test("the notebook parser keeps safe cells and discards executable HTML outputs", () => {
  const preview = loadPreviewModule(resolvedPreview, async () => new Response());
  const parsed = preview.parseNotebookDocument({
    metadata: { kernelspec: { language: "python" } },
    cells: [
      { cell_type: "markdown", source: ["# Title\n", "<script>alert(1)</script>"] },
      {
        cell_type: "code",
        source: ["print('safe')"],
        outputs: [
          { output_type: "display_data", data: { "text/html": "<script>alert(1)</script>", "application/javascript": "alert(1)" } },
          { output_type: "stream", text: ["safe output"] },
        ],
      },
    ],
  }, "python");
  assert.equal(parsed.cells.length, 2);
  assert.equal(parsed.cells[1].outputs.length, 1);
  assert.equal(parsed.cells[1].outputs[0].kind, "text");
  assert.doesNotMatch(JSON.stringify(parsed.cells[1].outputs), /script|javascript|alert/);
});

test("the preview loader returns a normalized payload for an allowlisted notebook", async () => {
  const document = {
    metadata: { kernelspec: { language: "python" } },
    cells: [
      { cell_type: "markdown", source: ["# Safe preview"] },
      { cell_type: "code", source: ["print('ok')"], outputs: [{ output_type: "stream", text: ["ok\n"] }] },
    ],
  };
  const preview = loadPreviewModule(resolvedPreview, async () => new Response(JSON.stringify(document), { headers: { "content-type": "application/json" } }));
  const payload = await preview.loadCommunityNotebookPreview("safe-notebook");
  assert.equal(payload.resourceId, "safe-notebook");
  assert.equal(payload.upstreamRef, resolvedPreview.artifact.preview.upstreamRef);
  assert.equal(payload.cells.length, 2);
  assert.equal(payload.cells[1].outputs[0].text, "ok\n");
  assert.equal(payload.truncated, false);
});

test("the preview loader rejects oversized, unsupported and timed-out upstream responses", async () => {
  const oversized = loadPreviewModule(resolvedPreview, async () => new Response("{}", { headers: { "content-type": "application/json", "content-length": "2000001" } }));
  await assert.rejects(() => oversized.loadCommunityNotebookPreview("safe-notebook"), (error) => error.code === "PREVIEW_TOO_LARGE" && error.status === 413);

  const unsupported = loadPreviewModule(resolvedPreview, async () => new Response("{}", { headers: { "content-type": "text/html" } }));
  await assert.rejects(() => unsupported.loadCommunityNotebookPreview("safe-notebook"), (error) => error.code === "UNSUPPORTED_PREVIEW_TYPE" && error.status === 415);

  const timeout = loadPreviewModule(resolvedPreview, async () => { throw new DOMException("Timed out", "TimeoutError"); });
  await assert.rejects(() => timeout.loadCommunityNotebookPreview("safe-notebook"), (error) => error.code === "PREVIEW_TIMEOUT" && error.status === 504);
});

test("the public UI exposes resources without adding them to completion math", () => {
  const curriculum = read("app/enterprise/curriculum.ts");
  const course = read("app/components/enterprise/CourseWorkspace.tsx");
  const catalog = read("app/components/enterprise/CatalogWorkspace.tsx");
  assert.match(curriculum, /kind:\s*"resource"/);
  assert.match(curriculum, /communityResources:/);
  assert.match(course, /"lessons",\s*"lab",\s*"quiz",\s*"resources"/);
  assert.match(course, /Consultarlas no modifica el progreso/);
  assert.match(course, /completedLessons\.size\s*\+\s*Number\(progress\?\.labAttested\)/);
  assert.doesNotMatch(course, /Number\([^)]*communityResources/);
  assert.match(catalog, /Módulos/);
  assert.match(catalog, /Notebooks/);
  assert.match(catalog, /previewOnly/);
});
