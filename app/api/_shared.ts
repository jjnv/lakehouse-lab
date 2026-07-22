import { getLearner } from "../enterprise/auth";
import type { ApiErrorBody } from "../enterprise/contracts";
import { LearningApiError } from "../enterprise/learning-service";
import { EnterpriseInputError, IdempotencyConflictError, LearnerAccessError } from "../enterprise/store";
import type { LearnerContext } from "../enterprise/types";

export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  vary: "Cookie",
};

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(JSON_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new LearningApiError(415, "JSON_REQUIRED", "La solicitud debe usar Content-Type: application/json.");
  }
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    throw new LearningApiError(403, "CROSS_SITE_REQUEST", "La operación debe iniciarse desde Lakehouse Lab.");
  }
  const origin = request.headers.get("origin");
  if (origin) {
    let expectedOrigin: string;
    try {
      expectedOrigin = new URL(request.url).origin;
    } catch {
      throw new LearningApiError(400, "INVALID_REQUEST_URL", "La URL de la solicitud no es válida.");
    }
    if (origin !== expectedOrigin) {
      throw new LearningApiError(403, "CROSS_ORIGIN_REQUEST", "La operación debe iniciarse desde el mismo origen.");
    }
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 1_500_000) {
    throw new LearningApiError(413, "PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido.");
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new LearningApiError(400, "INVALID_BODY", "No se pudo leer el cuerpo de la solicitud.");
  }
  if (!text || text.length > 1_500_000) throw new LearningApiError(text ? 413 : 400, text ? "PAYLOAD_TOO_LARGE" : "BODY_REQUIRED", text ? "La solicitud supera el tamaño permitido." : "La solicitud necesita un cuerpo JSON.");
  try {
    return JSON.parse(text);
  } catch {
    throw new LearningApiError(400, "INVALID_JSON", "El cuerpo no contiene JSON válido.");
  }
}

export async function withLearner(handler: (learner: LearnerContext) => Promise<Response>) {
  try {
    const learner = await getLearner();
    if (!learner) return errorResponse(401, "AUTHENTICATION_REQUIRED", "Inicia tu espacio personal para guardar el progreso.", false);
    return await handler(learner);
  } catch (error) {
    if (error instanceof LearningApiError) return errorResponse(error.status, error.code, error.message, error.retryable, error.currentRevision);
    if (error instanceof LearnerAccessError) return errorResponse(403, "ACCESS_DENIED", error.message, false);
    if (error instanceof EnterpriseInputError) return errorResponse(422, "INVALID_ACTIVITY", error.message, false);
    if (error instanceof IdempotencyConflictError) return errorResponse(409, "IDEMPOTENCY_CONFLICT", error.message, false);
    return errorResponse(500, "INTERNAL_ERROR", "No se pudo completar la operación. Inténtalo de nuevo.", true);
  }
}

function errorResponse(status: number, code: string, message: string, retryable: boolean, currentRevision?: number) {
  const body: ApiErrorBody = { code, message, retryable, ...(currentRevision === undefined ? {} : { currentRevision }) };
  return json(body, { status });
}
