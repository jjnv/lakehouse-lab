import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);

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
    fetch,
    console,
    setTimeout,
    clearTimeout,
  }, { filename: "community-preview-verifier.cjs" });
  return commonJsModule.exports;
}

const registry = evaluateCommonJs(
  await transpile("app/curriculum/community-resources.ts"),
  (specifier) => {
    throw new Error(`Import inesperado en el registro: ${specifier}`);
  },
);
const previewCode = await transpile("app/enterprise/notebook-preview.ts");
const repositories = new Map(registry.communityRepositories.map((repository) => [repository.id, repository]));
const previewable = registry.communityArtifacts.filter((artifact) => artifact.preview);
const externalSources = registry.communityArtifacts.filter((artifact) => artifact.externalSource);
const failures = [];

for (const repository of registry.communityRepositories.filter((item) => item.licenseStatus === "verified")) {
  const repositoryPath = new URL(repository.url).pathname.replace(/^\/|\/$/g, "");
  const evidenceUrl = `https://raw.githubusercontent.com/${repositoryPath}/${repository.licenseEvidenceRef}/${repository.licenseEvidencePath}`;
  try {
    const response = await fetch(evidenceUrl, { redirect: "error", signal: AbortSignal.timeout(7_000) });
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

for (const artifact of previewable) {
  const repository = repositories.get(artifact.repositoryId);
  const previewModule = evaluateCommonJs(previewCode, (specifier) => {
    if (specifier === "../curriculum/community-resources") {
      return { findCommunityArtifact: () => ({ artifact, repository }) };
    }
    if (specifier === "./contracts") return {};
    throw new Error(`Import inesperado en el cargador: ${specifier}`);
  });
  try {
    const result = await previewModule.loadCommunityNotebookPreview(artifact.id);
    if (!result.cells.length) throw new Error("sin celdas compatibles");
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
    const response = await fetch(sourceUrl, {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(7_000),
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
  process.exitCode = 1;
} else {
  console.log(`\n${previewable.length} vistas internas y ${externalSources.length} enlaces externos verificados sin guardar copias locales.`);
}
