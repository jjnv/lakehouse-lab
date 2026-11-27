// Transpila el dominio del Playground (TypeScript puro) a CommonJS temporal para probarlo con node:test.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import ts from "typescript";

const workspace = process.cwd();
const require = createRequire(import.meta.url);

async function existingSource(basePath) {
  const candidates = extname(basePath) ? [basePath] : [`${basePath}.ts`, join(basePath, "index.ts")];
  for (const candidate of candidates) {
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`No se pudo resolver ${basePath}`);
}

export async function loadModules(entries) {
  const temporary = await mkdtemp(join(tmpdir(), "lakehouse-playground-"));
  const compiled = new Set();
  async function compile(sourcePath) {
    const absolute = resolve(sourcePath);
    if (compiled.has(absolute)) return;
    compiled.add(absolute);
    const source = await readFile(absolute, "utf8");
    const ast = ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of ast.statements) {
      const specifier = (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteralLike(statement.moduleSpecifier) ? statement.moduleSpecifier.text : null;
      const typeOnly = ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly;
      if (specifier?.startsWith(".") && !typeOnly) await compile(await existingSource(resolve(dirname(absolute), specifier)));
    }
    const result = ts.transpileModule(source, {
      fileName: absolute,
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true, strict: true },
    });
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    assert.deepEqual(errors, [], `No se pudo transpilar ${absolute}`);
    const target = join(temporary, absolute.slice(workspace.length + 1).replace(/\.ts$/u, ".js"));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, result.outputText, "utf8");
  }
  for (const entry of entries) await compile(join(workspace, entry));
  const modules = Object.fromEntries(entries.map((entry) => [entry, require(join(temporary, entry.replace(/\.ts$/u, ".js")))]));
  return { modules, cleanup: () => rm(temporary, { recursive: true, force: true }) };
}

/** Ejecuta una ruta de referencia con los tokens @diagnose, @drain y @close. */
export function runPath(engine, definition, actions, options = { seed: 42, mode: "evaluation" }) {
  let state = engine.createSimulation(definition, options);
  for (const token of actions) {
    if (token === "@diagnose") state = engine.applyInput(definition, state, { type: "diagnose", hypotheses: definition.referenceDiagnosis });
    else if (token === "@close") state = engine.applyInput(definition, state, { type: "close" });
    else if (token === "@drain") {
      let guard = 0;
      while (state.objectivesMetAtMinute === null && state.status === "running" && guard < 40) {
        state = engine.applyInput(definition, state, { type: "action", actionId: definition.waitActionId });
        guard += 1;
      }
    } else state = engine.applyInput(definition, state, { type: "action", actionId: token });
  }
  return state;
}
