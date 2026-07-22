import { getSessionUser, requireSessionUser } from "../session-auth";
import { ensureLearner, LearnerAccessError } from "./store";
import type { EnterpriseRole, LearnerContext } from "./types";

/**
 * Resolves the private browser session, creates the learner record on first
 * access and guarantees the idempotent professional-v1 enrollment.
 * Call only from server components, server actions or route handlers.
 */
export async function requireLearner(returnTo = "/"): Promise<LearnerContext> {
  const identity = await requireSessionUser(returnTo);
  return ensureLearner({
    email: identity.email,
    displayName: identity.displayName,
    fullName: identity.fullName,
  });
}

/**
 * Optional variant for authenticated layouts that can render a signed-out
 * state. Missing identity returns null; an explicitly disabled member still
 * raises LearnerAccessError.
 */
export async function getLearner(): Promise<LearnerContext | null> {
  const identity = await getSessionUser();
  if (!identity) return null;
  return ensureLearner({
    email: identity.email,
    displayName: identity.displayName,
    fullName: identity.fullName,
  });
}

export async function requireEnterpriseRole(role: EnterpriseRole, returnTo = "/") {
  const learner = await requireLearner(returnTo);
  if (!learner.roles.includes(role)) {
    throw new LearnerAccessError(`La cuenta necesita el rol ${role} para realizar esta acción.`);
  }
  return learner;
}
