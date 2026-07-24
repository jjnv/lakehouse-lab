import { createHash } from "node:crypto";
import {
  findCommunityArtifact,
  type CommunityArtifact,
  type CommunityRepository,
} from "../curriculum/community-resources";
import { findNotebookGuide } from "../curriculum/notebook-guides";
import type {
  NotebookCellGuide,
  NotebookGuideCoverage,
  NotebookGuideReference,
  NotebookPreviewCell,
  NotebookPreviewOutput,
  NotebookPreviewPayload,
} from "./contracts";

const MAX_BYTES = 2_000_000;
const MAX_CELLS = 160;
const MAX_CELL_CHARACTERS = 60_000;
const MAX_OUTPUT_CHARACTERS = 40_000;
const MAX_IMAGE_BASE64_CHARACTERS = 700_000;
const MAX_IMAGE_DIMENSION = 8_192;
const MAX_IMAGE_PIXELS = 16_000_000;
const ALLOWED_CONTENT_TYPES: Record<NonNullable<CommunityArtifact["preview"]>["kind"], readonly string[]> = {
  ipynb: ["application/json", "text/plain"],
  markdown: ["text/markdown", "text/plain"],
  "databricks-source": ["text/plain"],
};
const PREVIEW_EXTENSIONS: Record<NonNullable<CommunityArtifact["preview"]>["kind"], readonly string[]> = {
  ipynb: [".ipynb"],
  markdown: [".md", ".markdown"],
  "databricks-source": [".py", ".sql", ".scala", ".r"],
};

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

function normalizedSource(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

export function notebookCellDigest(kind: NotebookPreviewCell["kind"], language: string, source: string) {
  return createHash("sha256")
    .update(`${kind}\0${language.trim().toLocaleLowerCase("en")}\0${normalizedSource(source)}`, "utf8")
    .digest("hex");
}

type ParsedNotebookCell =
  | {
      sourceIndex: number;
      sourceDigest: string;
      kind: "markdown";
      text: string;
    }
  | {
      sourceIndex: number;
      sourceDigest: string;
      kind: "code";
      language: string;
      text: string;
      outputs: NotebookPreviewOutput[];
    };

function parsedCellIdentity(
  sourceIndex: number,
  kind: NotebookPreviewCell["kind"],
  language: string,
  completeSource: string,
) {
  return {
    sourceIndex,
    sourceDigest: notebookCellDigest(kind, language, completeSource),
  };
}

function curatedRawUrl(
  repository: CommunityRepository,
  preview: NonNullable<CommunityArtifact["preview"]>,
) {
  const repositoryMatch = /^https:\/\/github\.com\/([a-z0-9_.-]+)\/([a-z0-9_.-]+)\/?$/i.exec(repository.url);
  const pathParts = preview.path.split("/");
  const safePath = pathParts.length > 0
    && pathParts.every((part) => part && part !== "." && part !== ".." && !part.includes("\\") && !part.includes("\0"));
  if (!repositoryMatch || !safePath) {
    throw new NotebookPreviewError(404, "PREVIEW_NOT_AVAILABLE", "La fuente editorial de esta vista previa no es válida.");
  }
  const expected = `https://raw.githubusercontent.com/${encodeURIComponent(repositoryMatch[1])}/${encodeURIComponent(repositoryMatch[2])}/${preview.upstreamRef}/${pathParts.map(encodeURIComponent).join("/")}`;
  if (preview.rawUrl !== expected) {
    throw new NotebookPreviewError(404, "PREVIEW_NOT_AVAILABLE", "La fuente editorial de esta vista previa no coincide con el recurso revisado.");
  }
  return expected;
}

function previewExtension(preview: NonNullable<CommunityArtifact["preview"]>) {
  const normalizedPath = preview.path.toLocaleLowerCase("en");
  const extension = PREVIEW_EXTENSIONS[preview.kind].find((candidate) => normalizedPath.endsWith(candidate));
  if (!extension) {
    throw new NotebookPreviewError(404, "PREVIEW_NOT_AVAILABLE", "El formato editorial de esta vista previa no coincide con el archivo revisado.");
  }
  return extension;
}

function textOutput(data: Record<string, unknown>): NotebookPreviewOutput | null {
  const value = sourceText(data["text/plain"]);
  return value ? { kind: "text", text: limited(value, MAX_OUTPUT_CHARACTERS) } : null;
}

function imageDimensions(mime: "image/png" | "image/jpeg", bytes: Uint8Array) {
  if (mime === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length < 24 || !signature.every((value, index) => bytes[index] === value)) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length < 11 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (startOfFrame.has(marker)) {
      return {
        height: bytes[offset + 5] * 256 + bytes[offset + 6],
        width: bytes[offset + 7] * 256 + bytes[offset + 8],
      };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = bytes[offset + 2] * 256 + bytes[offset + 3];
    if (segmentLength < 2) return null;
    offset += segmentLength + 2;
  }
  return null;
}

function imageOutput(data: Record<string, unknown>): NotebookPreviewOutput | null {
  for (const mime of ["image/png", "image/jpeg"] as const) {
    const value = sourceText(data[mime]).replace(/\s+/g, "");
    if (value && value.length <= MAX_IMAGE_BASE64_CHARACTERS && /^[a-z0-9+/]+=*$/i.test(value)) {
      try {
        const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
        const dimensions = imageDimensions(mime, bytes);
        if (
          dimensions
          && dimensions.width > 0
          && dimensions.height > 0
          && dimensions.width <= MAX_IMAGE_DIMENSION
          && dimensions.height <= MAX_IMAGE_DIMENSION
          && dimensions.width * dimensions.height <= MAX_IMAGE_PIXELS
        ) {
          return { kind: "image", mime, dataUrl: `data:${mime};base64,${value}` };
        }
      } catch {
        // Invalid base64 is intentionally discarded.
      }
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
  const cells: ParsedNotebookCell[] = [];
  let truncated = document.cells.length > MAX_CELLS;
  for (const [sourceIndex, candidate] of document.cells.slice(0, MAX_CELLS).entries()) {
    const cell = record(candidate);
    if (!cell) continue;
    const original = normalizedSource(sourceText(cell.source));
    if (!original.trim()) continue;
    const text = limited(original, MAX_CELL_CHARACTERS);
    truncated ||= text.length !== original.length;
    if (cell.cell_type === "markdown") {
      cells.push({
        ...parsedCellIdentity(sourceIndex, "markdown", "markdown", original),
        kind: "markdown",
        text,
      });
    } else if (cell.cell_type === "code") {
      cells.push({
        ...parsedCellIdentity(sourceIndex, "code", language, original),
        kind: "code",
        language,
        text,
        outputs: notebookOutputs(cell.outputs),
      });
    }
  }
  if (!cells.length) throw new NotebookPreviewError(502, "EMPTY_NOTEBOOK", "El notebook remoto no contiene celdas de lectura compatibles.");
  return { cells, truncated };
}

function commentPrefixForLanguage(language: string) {
  switch (language.trim().toLocaleLowerCase("en")) {
    case "sql":
      return "--";
    case "scala":
      return "//";
    default:
      return "#";
  }
}

export function parseDatabricksSource(value: string, language: string) {
  const commentPrefix = commentPrefixForLanguage(language);
  const escapedPrefix = commentPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const commandPattern = new RegExp(`^\\s*${escapedPrefix}\\s+COMMAND\\s+-{5,}\\s*$`, "m");
  const headerPattern = new RegExp(`^\\s*${escapedPrefix}\\s+Databricks notebook source\\s*$`);
  const magicPattern = new RegExp(`^\\s*${escapedPrefix}\\s*MAGIC\\b`);
  const stripMagicPattern = new RegExp(`^\\s*${escapedPrefix}\\s*MAGIC\\s?`);
  const blocks = normalizedSource(value).split(commandPattern);
  const cells: ParsedNotebookCell[] = [];
  let truncated = blocks.length > MAX_CELLS;
  for (const [sourceIndex, block] of blocks.slice(0, MAX_CELLS).entries()) {
    const lines = block.split("\n");
    const meaningful = lines.filter((line) => line.trim() && !headerPattern.test(line));
    if (!meaningful.length) continue;
    const magic = meaningful.every((line) => magicPattern.test(line));
    if (magic) {
      const original = meaningful.map((line) => line.replace(stripMagicPattern, "")).join("\n").replace(/^\s*%md\s*/, "");
      if (original.trim()) {
        cells.push({
          ...parsedCellIdentity(sourceIndex, "markdown", "markdown", original),
          kind: "markdown",
          text: limited(original, MAX_CELL_CHARACTERS),
        });
      }
    } else {
      const original = meaningful.join("\n");
      cells.push({
        ...parsedCellIdentity(sourceIndex, "code", language, original),
        kind: "code",
        language,
        text: limited(original, MAX_CELL_CHARACTERS),
        outputs: [],
      });
    }
    truncated ||= meaningful.join("\n").length > MAX_CELL_CHARACTERS;
  }
  if (!cells.length) throw new NotebookPreviewError(502, "EMPTY_NOTEBOOK", "El archivo remoto no contiene celdas de lectura compatibles.");
  return { cells, truncated };
}

export function parseMarkdownDocument(value: string) {
  const original = normalizedSource(value);
  if (!original.trim()) {
    throw new NotebookPreviewError(502, "EMPTY_NOTEBOOK", "El documento remoto no contiene texto compatible.");
  }
  const text = limited(original, MAX_CELL_CHARACTERS);
  return {
    cells: [{
      ...parsedCellIdentity(0, "markdown", "markdown", original),
      kind: "markdown" as const,
      text,
    }],
    truncated: text.length !== original.length,
  };
}

type NotebookGuideManifest = {
  resourceId: string;
  upstreamRef: string;
  path: string;
  reviewedAt: string;
  references: NotebookGuideReference[];
  cells: Array<{
    sourceIndex: number;
    sourceDigest: string;
    guide: NotebookCellGuide;
  }>;
};

function guideCoverage(
  resourceId: string,
  upstreamRef: string,
  path: string,
  cells: ParsedNotebookCell[],
) {
  const manifest = findNotebookGuide(resourceId) as NotebookGuideManifest | undefined;
  const manifestMatches = manifest?.resourceId === resourceId
    && manifest.upstreamRef === upstreamRef
    && manifest.path === path;
  const guidesByIndex = manifestMatches
    ? new Map(manifest.cells.map((cell) => [cell.sourceIndex, cell]))
    : new Map<number, NotebookGuideManifest["cells"][number]>();
  const usedReferenceIds = new Set<string>();
  let annotatedCells = 0;
  const publicCells: NotebookPreviewCell[] = cells.map((cell) => {
    const candidate = guidesByIndex.get(cell.sourceIndex);
    const guide = candidate?.sourceDigest === cell.sourceDigest ? candidate.guide : null;
    if (guide) {
      annotatedCells += 1;
      for (const point of guide.points) {
        for (const referenceId of point.referenceIds) usedReferenceIds.add(referenceId);
      }
    }
    return {
      ...cell,
      id: `${resourceId}:${cell.sourceIndex}:${cell.sourceDigest.slice(0, 12)}`,
      guide,
    } as NotebookPreviewCell;
  });
  const references = manifestMatches
    ? manifest.references.filter((reference) => usedReferenceIds.has(reference.id))
    : [];
  const coverage: NotebookGuideCoverage = {
    status: publicCells.length > 0 && annotatedCells === publicCells.length ? "complete" : "partial",
    annotatedCells,
    totalCells: publicCells.length,
    reviewedAt: manifestMatches ? manifest.reviewedAt : null,
    references,
  };
  return { cells: publicCells, coverage };
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
  const rawUrl = curatedRawUrl(repository, artifact.preview);
  const extension = previewExtension(artifact.preview);

  let response: Response;
  try {
    response = await fetch(rawUrl, {
      signal: AbortSignal.timeout(7_000),
      redirect: "error",
      headers: {
        accept: artifact.preview.kind === "ipynb"
          ? "application/json,text/plain;q=0.9"
          : artifact.preview.kind === "markdown"
            ? "text/markdown,text/plain;q=0.9"
            : "text/plain",
      },
      next: { revalidate: 86_400 },
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new NotebookPreviewError(timedOut ? 504 : 502, timedOut ? "PREVIEW_TIMEOUT" : "UPSTREAM_UNAVAILABLE", timedOut ? "La fuente tardó demasiado en responder." : "No se pudo consultar la fuente del notebook.");
  }
  if (!response.ok) throw new NotebookPreviewError(502, "UPSTREAM_ERROR", "La fuente original no pudo entregar el notebook.");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  if (!contentType || !ALLOWED_CONTENT_TYPES[artifact.preview.kind].includes(contentType)) {
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
  let parsed: { cells: ParsedNotebookCell[]; truncated: boolean };
  if (artifact.preview.kind === "ipynb") {
    let document: unknown;
    try {
      document = JSON.parse(text);
    } catch {
      throw new NotebookPreviewError(502, "INVALID_NOTEBOOK", "La fuente no devolvió JSON de notebook válido.");
    }
    parsed = parseNotebookDocument(document, fallbackLanguage);
  } else if (artifact.preview.kind === "markdown") {
    parsed = parseMarkdownDocument(text);
  } else {
    const language = extension === ".sql"
      ? "sql"
      : extension === ".scala"
        ? "scala"
        : extension === ".r"
          ? "r"
          : "python";
    parsed = parseDatabricksSource(text, language);
  }

  const guided = guideCoverage(
    artifact.id,
    artifact.preview.upstreamRef,
    artifact.preview.path,
    parsed.cells,
  );
  return {
    resourceId: artifact.id,
    title: artifact.title,
    sourceHref: artifact.href ?? repository.url,
    upstreamRef: artifact.preview.upstreamRef,
    path: artifact.preview.path,
    reviewedAt: repository.reviewedAt,
    cells: guided.cells,
    truncated: parsed.truncated,
    guideCoverage: guided.coverage,
  };
}
