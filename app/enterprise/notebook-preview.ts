import { findCommunityArtifact } from "../curriculum/community-resources";
import type { NotebookPreviewCell, NotebookPreviewOutput, NotebookPreviewPayload } from "./contracts";

const MAX_BYTES = 2_000_000;
const MAX_CELLS = 160;
const MAX_CELL_CHARACTERS = 60_000;
const MAX_OUTPUT_CHARACTERS = 40_000;
const MAX_IMAGE_BASE64_CHARACTERS = 700_000;
const ALLOWED_CONTENT_TYPES = ["application/json", "text/plain", "application/octet-stream"];

export class NotebookPreviewError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "NotebookPreviewError";
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function sourceText(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.join("");
  return "";
}

function limited(value: string, maximum: number) {
  return value.length > maximum ? `${value.slice(0, maximum)}\n\n[Contenido recortado]` : value;
}

function textOutput(data: Record<string, unknown>): NotebookPreviewOutput | null {
  const value = sourceText(data["text/plain"]);
  return value ? { kind: "text", text: limited(value, MAX_OUTPUT_CHARACTERS) } : null;
}

function imageOutput(data: Record<string, unknown>): NotebookPreviewOutput | null {
  for (const mime of ["image/png", "image/jpeg"] as const) {
    const value = sourceText(data[mime]).replace(/\s+/g, "");
    if (value && value.length <= MAX_IMAGE_BASE64_CHARACTERS && /^[a-z0-9+/]+=*$/i.test(value)) {
      return { kind: "image", mime, dataUrl: `data:${mime};base64,${value}` };
    }
  }
  return null;
}

function notebookOutputs(value: unknown): NotebookPreviewOutput[] {
  if (!Array.isArray(value)) return [];
  const outputs: NotebookPreviewOutput[] = [];
  for (const candidate of value.slice(0, 12)) {
    const output = record(candidate);
    if (!output) continue;
    if (output.output_type === "stream") {
      const text = sourceText(output.text);
      if (text) outputs.push({ kind: "text", text: limited(text, MAX_OUTPUT_CHARACTERS) });
      continue;
    }
    const data = record(output.data);
    if (!data) continue;
    const image = imageOutput(data);
    const text = textOutput(data);
    if (image) outputs.push(image);
    else if (text) outputs.push(text);
  }
  return outputs;
}

export function parseNotebookDocument(value: unknown, fallbackLanguage: string) {
  const document = record(value);
  if (!document || !Array.isArray(document.cells)) {
    throw new NotebookPreviewError(502, "INVALID_NOTEBOOK", "El archivo remoto no contiene un notebook válido.");
  }
  const metadata = record(document.metadata);
  const kernel = record(metadata?.kernelspec);
  const languageInfo = record(metadata?.language_info);
  const language = typeof kernel?.language === "string"
    ? kernel.language
    : typeof languageInfo?.name === "string"
      ? languageInfo.name
      : fallbackLanguage;
  const cells: NotebookPreviewCell[] = [];
  let truncated = document.cells.length > MAX_CELLS;
  for (const candidate of document.cells.slice(0, MAX_CELLS)) {
    const cell = record(candidate);
    if (!cell) continue;
    const original = sourceText(cell.source);
    if (!original.trim()) continue;
    const text = limited(original, MAX_CELL_CHARACTERS);
    truncated ||= text.length !== original.length;
    if (cell.cell_type === "markdown") {
      cells.push({ kind: "markdown", text });
    } else if (cell.cell_type === "code") {
      cells.push({ kind: "code", language, text, outputs: notebookOutputs(cell.outputs) });
    }
  }
  if (!cells.length) throw new NotebookPreviewError(502, "EMPTY_NOTEBOOK", "El notebook remoto no contiene celdas de lectura compatibles.");
  return { cells, truncated };
}

function stripMagicLine(line: string) {
  return line.replace(/^\s*(?:#|--)\s*MAGIC\s?/, "");
}

export function parseDatabricksSource(value: string, language: string) {
  const blocks = value.replace(/\r/g, "").split(/^\s*(?:#|--)\s+COMMAND\s+-{5,}\s*$/m);
  const cells: NotebookPreviewCell[] = [];
  let truncated = blocks.length > MAX_CELLS;
  for (const block of blocks.slice(0, MAX_CELLS)) {
    const lines = block.split("\n");
    const meaningful = lines.filter((line) => line.trim() && !/^\s*(?:#|--)\s+Databricks notebook source\s*$/.test(line));
    if (!meaningful.length) continue;
    const magic = meaningful.every((line) => /^\s*(?:#|--)\s*MAGIC\b/.test(line));
    if (magic) {
      const text = meaningful.map(stripMagicLine).join("\n").replace(/^\s*%md\s*/, "");
      if (text.trim()) cells.push({ kind: "markdown", text: limited(text, MAX_CELL_CHARACTERS) });
    } else {
      const text = limited(meaningful.join("\n"), MAX_CELL_CHARACTERS);
      cells.push({ kind: "code", language, text, outputs: [] });
    }
    truncated ||= meaningful.join("\n").length > MAX_CELL_CHARACTERS;
  }
  if (!cells.length) throw new NotebookPreviewError(502, "EMPTY_NOTEBOOK", "El archivo remoto no contiene celdas de lectura compatibles.");
  return { cells, truncated };
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
    throw new NotebookPreviewError(413, "PREVIEW_TOO_LARGE", "El notebook supera el tamaño permitido para la vista previa.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) {
      await reader.cancel();
      throw new NotebookPreviewError(413, "PREVIEW_TOO_LARGE", "El notebook supera el tamaño permitido para la vista previa.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function loadCommunityNotebookPreview(resourceId: string): Promise<NotebookPreviewPayload> {
  const resolved = findCommunityArtifact(resourceId);
  if (!resolved) throw new NotebookPreviewError(404, "RESOURCE_NOT_FOUND", "El recurso comunitario indicado no existe.");
  const { artifact, repository } = resolved;
  if (!artifact.preview || repository.licenseStatus !== "verified") {
    throw new NotebookPreviewError(404, "PREVIEW_NOT_AVAILABLE", "Este recurso no dispone de una vista previa con licencia y formato verificados.");
  }

  let response: Response;
  try {
    response = await fetch(artifact.preview.rawUrl, {
      signal: AbortSignal.timeout(7_000),
      headers: { accept: artifact.preview.kind === "ipynb" ? "application/json,text/plain;q=0.9" : "text/plain" },
      next: { revalidate: 86_400 },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new NotebookPreviewError(timedOut ? 504 : 502, timedOut ? "PREVIEW_TIMEOUT" : "UPSTREAM_UNAVAILABLE", timedOut ? "La fuente tardó demasiado en responder." : "No se pudo consultar la fuente del notebook.");
  }
  if (!response.ok) throw new NotebookPreviewError(502, "UPSTREAM_ERROR", "La fuente original no pudo entregar el notebook.");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new NotebookPreviewError(415, "UNSUPPORTED_PREVIEW_TYPE", "La fuente respondió con un formato que no se puede previsualizar de forma segura.");
  }

  let text: string;
  try {
    text = await readLimitedBody(response);
  } catch (error) {
    if (error instanceof NotebookPreviewError) throw error;
    throw new NotebookPreviewError(502, "INVALID_ENCODING", "La fuente no utiliza una codificación de texto compatible.");
  }

  const fallbackLanguage = artifact.languages[0]?.toLocaleLowerCase("es") ?? "text";
  let parsed: { cells: NotebookPreviewCell[]; truncated: boolean };
  if (artifact.preview.kind === "ipynb") {
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new NotebookPreviewError(502, "INVALID_NOTEBOOK", "La fuente no devolvió JSON de notebook válido.");
    }
    parsed = parseNotebookDocument(document, fallbackLanguage);
  } else {
    parsed = parseDatabricksSource(text, artifact.preview.path.endsWith(".sql") ? "sql" : fallbackLanguage);
  }

  return {
    resourceId: artifact.id,
    title: artifact.title,
    sourceHref: artifact.href ?? repository.url,
    upstreamRef: artifact.preview.upstreamRef,
    path: artifact.preview.path,
    reviewedAt: repository.reviewedAt,
    cells: parsed.cells,
    truncated: parsed.truncated,
  };
}
