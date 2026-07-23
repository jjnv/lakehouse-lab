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
    atob,
    DOMException,
    DataView,
    Headers,
    Response,
    Set,
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
  const githubOnly = registry.communityArtifacts.filter((artifact) => artifact.externalSource);
  assert.equal(registry.communityArtifacts.length, 36);
  assert.equal(previewable.length, 19);
  assert.equal(githubOnly.length, 17);
  for (const artifact of previewable) {
    const repository = repositories.get(artifact.repositoryId);
    assert.equal(repository?.licenseStatus, "verified");
    assert.ok(repository.licenseEvidencePath);
    assert.equal(repository.licenseEvidenceRef, artifact.preview.upstreamRef);
    assert.match(artifact.preview.upstreamRef, /^[a-f0-9]{40}$/);
    assert.match(artifact.preview.rawUrl, /^https:\/\/raw\.githubusercontent\.com\//);
    assert.ok(artifact.preview.path);
  }

  const previewableArtifactIds = new Set(previewable.map((artifact) => artifact.id));
  const previewableRecommendations = registry.moduleResourceRecommendations
    .filter((recommendation) => previewableArtifactIds.has(recommendation.artifact.id));
  assert.equal(previewableRecommendations.length, 47);
  assert.equal(new Set(previewableRecommendations.map((recommendation) => recommendation.moduleId)).size, 27);
});

test("all 36 artifacts have exactly one safe commit-pinned reviewed source", () => {
  for (const artifact of registry.communityArtifacts) {
    const reviewedSources = [artifact.preview, artifact.externalSource].filter(Boolean);
    assert.equal(reviewedSources.length, 1, `${artifact.id} must declare exactly one reviewed source`);
    const reviewedSource = reviewedSources[0];
    assert.match(reviewedSource.upstreamRef, /^[a-f0-9]{40}$/, `${artifact.id} must use a full commit SHA`);
    assert.ok(reviewedSource.path, `${artifact.id} must identify a concrete file`);
    assert.equal(
      reviewedSource.path.split("/").some((part) => (
        !part || part === "." || part === ".." || part.includes("\\") || part.includes("\0")
      )),
      false,
      `${artifact.id} must use a safe repository-relative path`,
    );
  }
});

test("verified licenses keep commit-pinned evidence, including the newly previewed repositories", () => {
  const expectedLicenses = new Map([
    ["databricks-examples", "CC0-1.0"],
    ["crdb", "Apache-2.0"],
    ["lighthouse", "MIT"],
  ]);

  for (const repository of registry.communityRepositories.filter((item) => item.licenseStatus === "verified")) {
    assert.ok(repository.licenseEvidencePath, `${repository.id} must declare its license file`);
    assert.match(repository.licenseEvidenceRef, /^[a-f0-9]{40}$/, `${repository.id} must pin its license evidence`);
  }
  for (const [repositoryId, license] of expectedLicenses) {
    const repository = registry.communityRepositories.find((item) => item.id === repositoryId);
    assert.equal(repository?.licenseStatus, "verified");
    assert.equal(repository?.license, license);
  }
});

function loadCurriculumModule() {
  const moduleIds = [...new Set(registry.moduleResourceRecommendations.map((item) => item.moduleId))];
  const fakeModules = moduleIds.map((id, index) => ({
    id,
    slug: `module-${id}`,
    number: String(index + 1).padStart(2, "0"),
    title: `Module ${id}`,
    short: id,
    description: `Description ${id}`,
    track: "core",
    level: "Associate",
    minutes: 60,
    prerequisites: [],
    outcomes: [],
    examDomains: [],
    lessons: [],
    sources: [],
    quiz: [],
    lab: {},
  }));
  return evaluateCommonJs(transpile("app/enterprise/curriculum.ts"), {
    "../course-data": {
      buildExamQuestions: () => [],
      modules: fakeModules,
      trackMeta: { core: { name: "Core" } },
    },
    "../progress": { CONTENT_VERSION: "test" },
    "../curriculum/community-resources": registry,
    "./assessment-private": { prepareAssessment: () => ({}) },
    "./search-anchor": { conceptAnchor: () => "concept" },
  });
}

test("the public catalog exposes the exact reviewed file URL, view mode and source path", () => {
  const curriculum = loadCurriculumModule();
  const catalog = curriculum.communityResourceCatalog();
  const artifacts = new Map(registry.communityArtifacts.map((artifact) => [artifact.id, artifact]));
  const repositories = new Map(registry.communityRepositories.map((repository) => [repository.id, repository]));

  assert.equal(catalog.length, 36);
  assert.equal(catalog.filter((resource) => resource.viewMode === "internal").length, 19);
  assert.equal(catalog.filter((resource) => resource.viewMode === "github").length, 17);

  for (const resource of catalog) {
    const artifact = artifacts.get(resource.id);
    const repository = repositories.get(artifact.repositoryId);
    const reviewedSource = artifact.preview ?? artifact.externalSource;
    const expectedHref = `${repository.url}/blob/${reviewedSource.upstreamRef}/${reviewedSource.path.split("/").map(encodeURIComponent).join("/")}`;

    assert.equal(resource.href, expectedHref, `${resource.id} must link to the reviewed file`);
    assert.equal(resource.sourcePath, reviewedSource.path);
    assert.equal(resource.upstreamRef, reviewedSource.upstreamRef);
    assert.equal(resource.viewMode, artifact.preview ? "internal" : "github");
    assert.equal(resource.previewAvailable, Boolean(artifact.preview));
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
    atob,
    DOMException,
    DataView,
    Headers,
    Response,
    Set,
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

function resolvedPreviewFor(kind, path, languages = ["Python"]) {
  const resolved = structuredClone(resolvedPreview);
  resolved.artifact.languages = languages;
  resolved.artifact.preview.kind = kind;
  resolved.artifact.preview.path = path;
  resolved.artifact.preview.rawUrl = `https://raw.githubusercontent.com/example/repo/${resolved.artifact.preview.upstreamRef}/${path.split("/").map(encodeURIComponent).join("/")}`;
  return resolved;
}

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

test("the Markdown parser returns one inert text cell without interpreting embedded HTML", () => {
  const preview = loadPreviewModule(resolvedPreview, async () => new Response());
  const source = "# Guide\n\n<script>globalThis.executed = true</script>\n\n```js\nalert('still text')\n```";
  const parsed = preview.parseMarkdownDocument(source);

  assert.equal(parsed.cells.length, 1);
  assert.equal(parsed.cells[0].kind, "markdown");
  assert.equal(parsed.cells[0].text, source);
  assert.equal("outputs" in parsed.cells[0], false);
  assert.equal(parsed.truncated, false);
});

test("the Databricks source parser recognizes Scala COMMAND boundaries and MAGIC Markdown", () => {
  const preview = loadPreviewModule(resolvedPreview, async () => new Response());
  const parsed = preview.parseDatabricksSource([
    "// Databricks notebook source",
    "// MAGIC %md",
    "// MAGIC # Delta metrics",
    "// MAGIC This is documentation.",
    "// COMMAND ----------",
    "val tableName = \"main.default.events\"",
    "spark.table(tableName).count()",
  ].join("\n"), "scala");

  assert.equal(parsed.cells.length, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(parsed.cells)),
    [
      { kind: "markdown", text: "# Delta metrics\nThis is documentation." },
      {
        kind: "code",
        language: "scala",
        text: "val tableName = \"main.default.events\"\nspark.table(tableName).count()",
        outputs: [],
      },
    ],
  );
});

test("the Databricks source parser only recognizes markers for the declared language", () => {
  const preview = loadPreviewModule(resolvedPreview, async () => new Response());
  const supported = [
    ["python", "#"],
    ["r", "#"],
    ["sql", "--"],
    ["scala", "//"],
  ];
  for (const [language, marker] of supported) {
    const parsed = preview.parseDatabricksSource([
      `${marker} Databricks notebook source`,
      "first_statement",
      `${marker} COMMAND ----------`,
      "second_statement",
    ].join("\n"), language);
    assert.equal(parsed.cells.length, 2, `${language} must recognize its own marker`);
  }

  const pythonWithScalaMarker = preview.parseDatabricksSource([
    "# Databricks notebook source",
    "first_statement",
    "// COMMAND ----------",
    "second_statement",
  ].join("\n"), "python");
  assert.equal(pythonWithScalaMarker.cells.length, 1);
  assert.match(pythonWithScalaMarker.cells[0].text, /\/\/ COMMAND ----------/);
});

test("image outputs require valid PNG or JPEG signatures and safe dimensions", () => {
  const preview = loadPreviewModule(resolvedPreview, async () => new Response());
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x03,
  ]).toString("base64");
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x07, 0x08, 0x00, 0x02, 0x00, 0x03,
  ]).toString("base64");
  const spoofedPng = Buffer.from("not a png").toString("base64");
  const oversizedPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x23, 0x28, 0x00, 0x00, 0x23, 0x28,
  ]).toString("base64");
  const parsed = preview.parseNotebookDocument({
    cells: [
      {
        cell_type: "code",
        source: "display(png)",
        outputs: [{ output_type: "display_data", data: { "image/png": png } }],
      },
      {
        cell_type: "code",
        source: "display(jpeg)",
        outputs: [{ output_type: "display_data", data: { "image/jpeg": jpeg } }],
      },
      {
        cell_type: "code",
        source: "display(spoofed)",
        outputs: [{ output_type: "display_data", data: { "image/png": spoofedPng } }],
      },
      {
        cell_type: "code",
        source: "display(oversized)",
        outputs: [{ output_type: "display_data", data: { "image/png": oversizedPng } }],
      },
    ],
  }, "python");

  assert.equal(parsed.cells[0].outputs[0].mime, "image/png");
  assert.equal(parsed.cells[1].outputs[0].mime, "image/jpeg");
  assert.equal(parsed.cells[2].outputs.length, 0);
  assert.equal(parsed.cells[3].outputs.length, 0);
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

test("the preview loader enforces an extension compatible with the curated kind", async () => {
  const mismatches = [
    ["ipynb", "README.md"],
    ["markdown", "notebook.ipynb"],
    ["databricks-source", "archive.dbc"],
  ];
  for (const [kind, path] of mismatches) {
    let fetchCalls = 0;
    const preview = loadPreviewModule(resolvedPreviewFor(kind, path), async () => {
      fetchCalls += 1;
      return new Response();
    });
    await assert.rejects(
      () => preview.loadCommunityNotebookPreview("safe-notebook"),
      (error) => error.code === "PREVIEW_NOT_AVAILABLE" && error.status === 404,
    );
    assert.equal(fetchCalls, 0);
  }
});

test("the preview loader applies a strict MIME matrix for every curated kind", async () => {
  const markdownResolved = resolvedPreviewFor("markdown", "README.md", ["Markdown"]);
  const markdown = loadPreviewModule(
    markdownResolved,
    async () => new Response("# Safe guide", { headers: { "content-type": "text/markdown; charset=utf-8" } }),
  );
  const markdownPayload = await markdown.loadCommunityNotebookPreview("safe-notebook");
  assert.equal(markdownPayload.cells[0].kind, "markdown");

  const sourceResolved = resolvedPreviewFor("databricks-source", "notebook.scala", ["Scala"]);
  const source = loadPreviewModule(
    sourceResolved,
    async () => new Response("// Databricks notebook source\nval safe = true", { headers: { "content-type": "text/plain" } }),
  );
  const sourcePayload = await source.loadCommunityNotebookPreview("safe-notebook");
  assert.equal(sourcePayload.cells[0].kind, "code");
  assert.equal(sourcePayload.cells[0].language, "scala");

  const missingMimeResponse = new Response(JSON.stringify({ cells: [{ cell_type: "markdown", source: "# Missing MIME" }] }));
  missingMimeResponse.headers.delete("content-type");
  const invalidCases = [
    [resolvedPreview, async () => missingMimeResponse],
    [markdownResolved, async () => new Response("# Wrong MIME", { headers: { "content-type": "application/json" } })],
    [sourceResolved, async () => new Response("val unsafeType = true", { headers: { "content-type": "application/octet-stream" } })],
  ];
  for (const [resolved, fetchImpl] of invalidCases) {
    const preview = loadPreviewModule(resolved, fetchImpl);
    await assert.rejects(
      () => preview.loadCommunityNotebookPreview("safe-notebook"),
      (error) => error.code === "UNSUPPORTED_PREVIEW_TYPE" && error.status === 415,
    );
  }
});

test("the preview loader rejects editorial raw URLs that diverge from repository, ref or path", async () => {
  const variants = [
    "https://raw.githubusercontent.com/attacker/repo/1234567890123456789012345678901234567890/notebook.ipynb",
    "https://raw.githubusercontent.com/example/repo/0000000000000000000000000000000000000000/notebook.ipynb",
    "https://raw.githubusercontent.com/example/repo/1234567890123456789012345678901234567890/other.ipynb",
  ];
  for (const rawUrl of variants) {
    let fetchCalls = 0;
    const resolved = structuredClone(resolvedPreview);
    resolved.artifact.preview.rawUrl = rawUrl;
    const preview = loadPreviewModule(resolved, async () => {
      fetchCalls += 1;
      return new Response();
    });
    await assert.rejects(
      () => preview.loadCommunityNotebookPreview("safe-notebook"),
      (error) => error.code === "PREVIEW_NOT_AVAILABLE" && error.status === 404,
    );
    assert.equal(fetchCalls, 0);
  }
});

test("the preview loader disables redirects and rejects a redirect response", async () => {
  let redirectPolicy = "";
  const preview = loadPreviewModule(resolvedPreview, async (_url, options) => {
    redirectPolicy = options.redirect;
    return new Response(null, {
      status: 302,
      headers: { location: "https://attacker.example/notebook.ipynb" },
    });
  });

  await assert.rejects(
    () => preview.loadCommunityNotebookPreview("safe-notebook"),
    (error) => error.code === "UPSTREAM_ERROR" && error.status === 502,
  );
  assert.equal(redirectPolicy, "error");
});

test("the public projection uses typed unavailability reasons and commit-pinned evidence links", () => {
  const contracts = read("app/enterprise/contracts.ts");
  const curriculum = read("app/enterprise/curriculum.ts");
  const reasons = ["license_unverified", "restricted_license", "no_compatible_file"];

  assert.match(contracts, /CommunityResourcePreviewUnavailableReason/);
  for (const reason of reasons) {
    assert.match(contracts, new RegExp(`"${reason}"`));
    assert.match(curriculum, new RegExp(`"${reason}"`));
  }
  assert.match(contracts, /licenseEvidenceHref:\s*string\s*\|\s*null/);
  assert.match(curriculum, /reviewedSourceHref/);
  assert.match(curriculum, /licenseEvidenceRef/);
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
