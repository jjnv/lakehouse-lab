import { NextResponse } from "next/server";
import {
  createSessionId,
  getCurrentSessionHash,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  sessionExpiryIso,
} from "../../session-auth";
import { hashSessionToken } from "../../enterprise/anonymous-recovery";
import {
  recoverAnonymousSession,
  RecoveryCodeError,
  revokeAnonymousSession,
} from "../../enterprise/store";
import { LearningApiError } from "../../enterprise/learning-service";
import { json, readJson } from "../_shared";

function sessionResponse(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("vary", "Cookie");
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const recoveryCode = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).recoveryCode
      : null;
    const sessionId = createSessionId();
    const expiresAt = sessionExpiryIso();
    await recoverAnonymousSession(recoveryCode, hashSessionToken(sessionId), expiresAt);

    const response = sessionResponse({ recovered: true, expiresAt });
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof RecoveryCodeError) {
      return json({
        code: "RECOVERY_CODE_INVALID",
        message: error.message,
        retryable: false,
      }, { status: 401 });
    }
    if (error instanceof LearningApiError) {
      return json({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      }, { status: error.status });
    }
    return json({
      code: "RECOVERY_FAILED",
      message: "No se pudo recuperar el espacio personal.",
      retryable: true,
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await readJson(request);
    const sessionHash = await getCurrentSessionHash();
    if (sessionHash) await revokeAnonymousSession(sessionHash);
    const response = sessionResponse({ revoked: Boolean(sessionHash) });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      ...sessionCookieOptions(),
      expires: new Date(0),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (error instanceof LearningApiError) {
      return json({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      }, { status: error.status });
    }
    return json({
      code: "SESSION_REVOCATION_FAILED",
      message: "No se pudo cerrar la sesión.",
      retryable: true,
    }, { status: 500 });
  }
}
