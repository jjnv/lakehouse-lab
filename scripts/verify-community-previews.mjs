import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const MAX_FETCH_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429]);
const FETCH_TIMEOUT_MS = 7_000;

function retryableStatus(status) {
  return RETRYABLE_STATUS_CODES.has(status) || status >= 500;
}

function retryableFetchError(error) {
  return error instanceof TypeError
    || (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError"));
}

function backoff(attempt) {
  return new Promise((resolve) => setTimeout(resolve, attempt * 150));
}

async function resilientFetch(input, init = {}) {
  const retryableInit = { ...init };
  delete retryableInit.signal;
  let lastError;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...retryableInit,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!retryableStatus(response.status) || attempt === MAX_FETCH_ATTEMPTS) return response;
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (!retryableFetchError(error) || attempt === MAX_FETCH_ATTEMPTS) throw error;
    }
    await backoff(attempt);
  }
  throw lastError;
}

async function transpile(path) {
  const source = await readFile(new URL(path, root), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: path,
  }).outputText;
}

function evaluateCommonJs(code, requireModule) {
  const commonJsModule = { exports: {} };
  vm.runInNewContext(code, {
    module: commonJsModule,
    exports: commonJsModule.exports,
    require: requireModule,
    AbortSignal,
    DOMException,
    Headers,
    Response,
    TextDecoder,
    Uint8Array,
    DataView,
    Set,
    URL,
    atob,
    fetch: resilientFetch,
    console,
    setTimeout,
    clearTimeout,
  }, { filename: "community-preview-verifier.cjs" });
  return commonJsModule.exports;
}

const localModuleCache = new Map();

function loadLocalTypeScriptModule(modulePath) {
  const normalizedPath = modulePath.replaceAll("\\", "/");
  if (localModuleCache.has(normalizedPath)) return localModuleCache.get(normalizedPath).exports;
  const commonJsModule = { exports: {} };
  localModuleCache.set(normalizedPath, commonJsModule);
  const source = readFileSync(new URL(normalizedPath, root), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: normalizedPath,
  }).outputText;
  const requireModule = (specifier) => {
    if (!specifier.startsWith(".")) throw new Error(`Import inesperado en ${normalizedPath}: ${specifier}`);
    const unresolved = path.posix.normalize(path.posix.join(path.posix.dirname(normalizedPath), specifier));
    const candidates = [
      `${unresolved}.ts`,
      `${unresolved}/index.ts`,
      unresolved,
    ];
    const resolved = candidates.find((candidate) => {
      const url = new URL(candidate, root);
      return existsSync(url) && statSync(url).isFile();
    });
    if (!resolved) throw new Error(`No se pudo resolver ${specifier} desde ${normalizedPath}`);
    return loadLocalTypeScriptModule(resolved);
  };
  const evaluated = evaluateCommonJs(code, requireModule);
  commonJsModule.exports = evaluated;
  return evaluated;
}

const registry = evaluateCommonJs(
  await transpile("app/curriculum/community-resources.ts"),
  (specifier) => {
    throw new Error(`Import inesperado en el registro: ${specifier}`);
  },
);
const guideRegistry = loadLocalTypeScriptModule("app/curriculum/notebook-guides/index.ts");
const previewCode = await transpile("app/enterprise/notebook-preview.ts");
const repositories = new Map(registry.communityRepositories.map((repository) => [repository.id, repository]));
const previewable = registry.communityArtifacts.filter((artifact) => artifact.preview);
const externalSources = registry.communityArtifacts.filter((artifact) => artifact.externalSource);
const failures = [];
const allowedGuideStatuses = new Set(["current", "demo-only", "legacy", "risky"]);
const observedGuideStatuses = new Set();
const sensitiveGuideCells = new Map([
  ["azure-governance:4", "warning"],
  ["crdb:3", "warning"],
  ["crdb:5", "warning"],
  ["crdb:18", "warning"],
  ["crdb:19", "risky"],
  ["crdb:20", "risky"],
  ["crdb:21", "risky"],
  ["crdb:22", "risky"],
  ["crdb:23", "risky"],
  ["databricks-examples:2", "risky"],
  ["delta-cdf:17", "risky"],
  ["delta-cdf:24", "risky"],
  ["delta-cdf:31", "risky"],
  ["delta-cdf:63", "risky"],
  ["delta-create-table:5", "risky"],
  ["yokawasa-eventhub:2", "warning"],
  ["yokawasa-notebooks:3", "warning"],
  ["yokawasa-notebooks:8", "risky"],
  ["yokawasa-notebooks:14", "risky"],
  ["yokawasa-notebooks:18", "risky"],
]);
const verifiedSensitiveGuideCells = new Set();

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validStringArray(value, { allowEmpty }) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every(nonEmptyString);
}

const registeredGuideManifests = guideRegistry.notebookGuideManifests;
const guideManifests = previewable.map((artifact) => guideRegistry.findNotebookGuide(artifact.id));
const guideCellCount = guideManifests.reduce((total, manifest) => total + (manifest?.cells.length ?? 0), 0);
if (
  !Array.isArray(registeredGuideManifests)
  || registeredGuideManifests.length !== 19
  || new Set(registeredGuideManifests.map((manifest) => manifest.resourceId)).size !== 19
  || previewable.length !== 19
  || guideManifests.some((manifest) => !manifest)
  || guideCellCount !== 393
) {
  failures.push(
    `guías editoriales: se esperaban 19 manifiestos y 393 guías; hay ${guideManifests.filter(Boolean).length} manifiestos y ${guideCellCount} guías`,
  );
}

for (const [index, artifact] of previewable.entries()) {
  const manifest = guideManifests[index];
  if (!manifest) continue;
  const referenceIds = new Set();
  const usedReferenceIds = new Set();
  if (
    manifest.resourceId !== artifact.id
    || manifest.upstreamRef !== artifact.preview.upstreamRef
    || manifest.path !== artifact.preview.path
    || !/^[a-f0-9]{40}$/.test(manifest.upstreamRef)
    || manifest.path.split("/").some((part) => (
      !part || part === "." || part === ".." || part.includes("\\") || part.includes("\0")
    ))
  ) {
    failures.push(`guía ${artifact.id}: resourceId, commit o path no coinciden con la fuente revisada`);
  }
  for (const reference of manifest.references) {
    if (
      !nonEmptyString(reference.id)
      || referenceIds.has(reference.id)
      || !nonEmptyString(reference.title)
      || !nonEmptyString(reference.publisher)
      || !/^https:\/\//.test(reference.href)
      || !nonEmptyString(reference.reviewedAt)
    ) {
      failures.push(`guía ${artifact.id}: referencia editorial inválida o duplicada (${reference.id || "sin id"})`);
    }
    referenceIds.add(reference.id);
  }
  const sourceIndexes = new Set();
  for (const cell of manifest.cells) {
    if (
      !Number.isSafeInteger(cell.sourceIndex)
      || cell.sourceIndex < 0
      || sourceIndexes.has(cell.sourceIndex)
      || !/^[a-f0-9]{64}$/.test(cell.sourceDigest)
      || Object.hasOwn(cell, "outputs")
      || !cell.guide
      || !Array.isArray(cell.guide.points)
      || cell.guide.points.length === 0
    ) {
      failures.push(`guía ${artifact.id}: índice, huella o contenido inválido en celda ${cell.sourceIndex}`);
    }
    sourceIndexes.add(cell.sourceIndex);
    const guide = cell.guide;
    if (
      guide
      && (
        !validStringArray(guide.prerequisites, { allowEmpty: true })
        || !validStringArray(guide.expectedEvidence, { allowEmpty: true })
      )
    ) {
      failures.push(`guía ${artifact.id}: prerrequisitos o evidencias inválidos en celda ${cell.sourceIndex}`);
    }
    const points = Array.isArray(guide?.points) ? guide.points : [];
    for (const [pointIndex, point] of points.entries()) {
      if (
        !nonEmptyString(point.title)
        || !nonEmptyString(point.what)
        || !nonEmptyString(point.why)
        || !allowedGuideStatuses.has(point.status)
        || !validStringArray(point.bestPractices, { allowEmpty: false })
        || !validStringArray(point.warnings, { allowEmpty: true })
        || !validStringArray(point.referenceIds, { allowEmpty: false })
      ) {
        failures.push(`guía ${artifact.id}: punto ${pointIndex} inválido en celda ${cell.sourceIndex}`);
      }
      observedGuideStatuses.add(point.status);
      const pointReferenceIds = Array.isArray(point.referenceIds) ? point.referenceIds : [];
      for (const referenceId of pointReferenceIds) {
        usedReferenceIds.add(referenceId);
        if (!referenceIds.has(referenceId)) {
          failures.push(`guía ${artifact.id}: la celda ${cell.sourceIndex} usa una referencia inexistente (${referenceId})`);
        }
      }
    }
    const sensitiveKey = `${artifact.id}:${cell.sourceIndex}`;
    const sensitiveExpectation = sensitiveGuideCells.get(sensitiveKey);
    if (sensitiveExpectation) {
      verifiedSensitiveGuideCells.add(sensitiveKey);
      const warnedPoints = points.filter((point) => validStringArray(point.warnings, { allowEmpty: false }));
      if (
        warnedPoints.length === 0
        || (sensitiveExpectation === "risky" && !warnedPoints.some((point) => point.status === "risky"))
      ) {
        failures.push(
          `guía ${artifact.id}: la celda sensible ${cell.sourceIndex} requiere estado ${sensitiveExpectation} y advertencia explícita`,
        );
      }
    }
  }
  for (const referenceId of referenceIds) {
    if (!usedReferenceIds.has(referenceId)) {
      failures.push(`guía ${artifact.id}: la referencia ${referenceId} no está usada`);
    }
  }
}

for (const sensitiveKey of sensitiveGuideCells.keys()) {
  if (!verifiedSensitiveGuideCells.has(sensitiveKey)) {
    failures.push(`guías editoriales: falta la celda sensible esperada ${sensitiveKey}`);
  }
}

for (const requiredStatus of ["risky", "legacy"]) {
  if (!observedGuideStatuses.has(requiredStatus)) {
    failures.push(`guías editoriales: falta cobertura explícita del estado ${requiredStatus}`);
  }
}

for (const repository of registry.communityRepositories.filter((item) => item.licenseStatus === "verified")) {
  const repositoryPath = new URL(repository.url).pathname.replace(/^\/|\/$/g, "");
  const evidenceUrl = `https://raw.githubusercontent.com/${repositoryPath}/${repository.licenseEvidenceRef}/${repository.licenseEvidencePath}`;
  try {
    const response = await resilientFetch(evidenceUrl, { redirect: "error" });
    const text = await response.text();
    if (!response.ok || text.length < 100 || text.length > 100_000) {
      throw new Error(`evidencia inválida (${response.status}, ${text.length} bytes)`);
    }
    console.log(`✓ licencia ${repository.id}: ${repository.license} · ${repository.licenseEvidencePath}`);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    failures.push(`licencia ${repository.id}: ${message}`);
    console.error(`✗ licencia ${repository.id}: ${message}`);
  }
}

for (const [artifactIndex, artifact] of previewable.entries()) {
  const repository = repositories.get(artifact.repositoryId);
  const manifest = guideManifests[artifactIndex];
  const previewModule = evaluateCommonJs(previewCode, (specifier) => {
    if (specifier === "../curriculum/community-resources") {
      return { findCommunityArtifact: () => ({ artifact, repository }) };
    }
    if (specifier === "../curriculum/notebook-guides") return guideRegistry;
    if (specifier === "node:crypto") return { createHash };
    if (specifier === "./contracts") return {};
    throw new Error(`Import inesperado en el cargador: ${specifier}`);
  });
  try {
    const result = await previewModule.loadCommunityNotebookPreview(artifact.id);
    if (!result.cells.length) throw new Error("sin celdas compatibles");
    if (
      !manifest
      || result.upstreamRef !== manifest.upstreamRef
      || result.path !== manifest.path
      || result.guideCoverage.status !== "complete"
      || result.guideCoverage.annotatedCells !== result.cells.length
      || result.guideCoverage.totalCells !== result.cells.length
      || result.cells.length !== manifest.cells.length
      || result.cells.some((cell) => !cell.guide)
    ) {
      throw new Error(
        `cobertura incompleta o fuente divergente (${result.guideCoverage.annotatedCells}/${result.guideCoverage.totalCells})`,
      );
    }
    const manifestCells = new Map(manifest.cells.map((cell) => [cell.sourceIndex, cell.sourceDigest]));
    for (const cell of result.cells) {
      if (
        manifestCells.get(cell.sourceIndex) !== cell.sourceDigest
        || cell.id !== `${artifact.id}:${cell.sourceIndex}:${cell.sourceDigest.slice(0, 12)}`
      ) {
        throw new Error(`huella o identidad divergente en celda ${cell.sourceIndex}`);
      }
    }
    const expectedReferenceIds = new Set(
      manifest.cells.flatMap((cell) => cell.guide.points.flatMap((point) => point.referenceIds)),
    );
    const actualReferenceIds = new Set(result.guideCoverage.references.map((reference) => reference.id));
    if (
      expectedReferenceIds.size !== actualReferenceIds.size
      || [...expectedReferenceIds].some((referenceId) => !actualReferenceIds.has(referenceId))
    ) {
      throw new Error("las referencias públicas no coinciden con las referencias usadas");
    }
    console.log(`✓ ${artifact.id}: ${result.cells.length} celdas · ${result.path}`);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    failures.push(`${artifact.id}: ${message}`);
    console.error(`✗ ${artifact.id}: ${message}`);
  }
}

for (const artifact of externalSources) {
  const repository = repositories.get(artifact.repositoryId);
  const repositoryPath = new URL(repository.url).pathname.replace(/^\/|\/$/g, "");
  const sourceUrl = `https://raw.githubusercontent.com/${repositoryPath}/${artifact.externalSource.upstreamRef}/${artifact.externalSource.path.split("/").map(encodeURIComponent).join("/")}`;
  try {
    const response = await resilientFetch(sourceUrl, {
      method: "HEAD",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`origen externo no disponible (${response.status})`);
    console.log(`✓ enlace externo ${artifact.id}: ${artifact.externalSource.path}`);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    failures.push(`enlace externo ${artifact.id}: ${message}`);
    console.error(`✗ enlace externo ${artifact.id}: ${message}`);
  }
}

if (failures.length) {
  console.error(`\nFallaron ${failures.length} comprobaciones editoriales.`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`\n${previewable.length} vistas internas y ${externalSources.length} enlaces externos verificados sin guardar copias locales.`);
}
