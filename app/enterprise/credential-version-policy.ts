export type SimulatorCredentialStatus = "pending" | "passed" | "revalidation-required";

export type CredentialVersionAttempt = Readonly<{
  id: string;
  kind: "module_quiz" | "associate_exam" | "professional_exam";
  assessmentVersion: string;
  provenance: "server_graded" | "legacy_client";
  passed: boolean | null;
  submittedAt: string | null;
}>;

export type ExistingCredentialStatus = "issued" | "revoked" | null;

export type CredentialVersionPolicy<T extends CredentialVersionAttempt> = Readonly<{
  simulatorStatus: Readonly<{
    associate: SimulatorCredentialStatus;
    professional: SimulatorCredentialStatus;
  }>;
  currentPassingAttempts: Readonly<{
    associate: T | null;
    professional: T | null;
  }>;
  hasEligibleSimulatorPair: boolean;
  credentialAlreadyExists: boolean;
  hasIssuedCredential: boolean;
}>;

export function evaluateCredentialVersionPolicy<T extends CredentialVersionAttempt>(input: Readonly<{
  attempts: readonly T[];
  currentAssessmentVersion: string;
  existingCredentialStatus: ExistingCredentialStatus;
}>): CredentialVersionPolicy<T> {
  const credentialAlreadyExists = input.existingCredentialStatus !== null;
  const hasIssuedCredential = input.existingCredentialStatus === "issued";

  const evidenceFor = (kind: "associate_exam" | "professional_exam") => {
    const historical = input.attempts.filter((attempt) => attempt.kind === kind && attempt.passed === true);
    const current = historical
      .filter((attempt) => attempt.provenance === "server_graded"
        && attempt.assessmentVersion === input.currentAssessmentVersion
        && attempt.submittedAt !== null)
      .sort((left, right) => String(right.submittedAt).localeCompare(String(left.submittedAt)))[0] ?? null;
    const status: SimulatorCredentialStatus = current || hasIssuedCredential
      ? "passed"
      : historical.length
        ? "revalidation-required"
        : "pending";
    return { current, status };
  };

  const associate = evidenceFor("associate_exam");
  const professional = evidenceFor("professional_exam");
  return {
    simulatorStatus: {
      associate: associate.status,
      professional: professional.status,
    },
    currentPassingAttempts: {
      associate: associate.current,
      professional: professional.current,
    },
    hasEligibleSimulatorPair: !credentialAlreadyExists && Boolean(associate.current && professional.current),
    credentialAlreadyExists,
    hasIssuedCredential,
  };
}
