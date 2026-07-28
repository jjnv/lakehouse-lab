import { NextResponse } from "next/server";
import { getLearner } from "../../enterprise/auth";
import { LearningApiError } from "../../enterprise/learning-service";
import { LearnerAccessError, setLearnerLocale } from "../../enterprise/store";
import { isLocale, LOCALE_COOKIE_NAME } from "../../i18n/config";
import { localeCookieOptions } from "../../i18n/server";
import { json } from "../_shared";

async function readLocaleJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new LearningApiError(415, "JSON_REQUIRED", "La solicitud debe usar Content-Type: application/json.");
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 10_000) {
    throw new LearningApiError(413, "PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido.");
  }
  const text = await request.text();
  if (!text || text.length > 10_000) {
    throw new LearningApiError(text ? 413 : 400, text ? "PAYLOAD_TOO_LARGE" : "BODY_REQUIRED", text ? "La solicitud supera el tamaño permitido." : "La solicitud necesita un cuerpo JSON.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new LearningApiError(400, "INVALID_JSON", "El cuerpo no contiene JSON válido.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await readLocaleJson(request);
    const locale = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).locale
      : null;
    if (!isLocale(locale)) {
      return json({ code: "INVALID_LOCALE", message: "Idioma no soportado.", retryable: false }, { status: 422 });
    }

    let learner = null;
    try {
      learner = await getLearner();
    } catch (error) {
      if (!(error instanceof LearnerAccessError)) throw error;
    }
    if (learner) {
      try {
        await setLearnerLocale(learner, locale);
      } catch (error) {
        if (!(error instanceof LearnerAccessError)) throw error;
      }
    }

    const response = NextResponse.json({ locale });
    response.headers.set("cache-control", "private, no-store, max-age=0");
    response.headers.set("vary", "Cookie");
    response.cookies.set(LOCALE_COOKIE_NAME, locale, localeCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof LearningApiError) {
      return json({ code: error.code, message: error.message, retryable: error.retryable }, { status: error.status });
    }
    return json({ code: "LOCALE_UPDATE_FAILED", message: "No se pudo cambiar el idioma.", retryable: true }, { status: 500 });
  }
}
