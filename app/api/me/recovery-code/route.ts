import { issueAnonymousRecoveryCode, revokeAnonymousRecoveryCode } from "../../../enterprise/store";
import { json, readJson, withLearner } from "../../_shared";

export async function POST(request: Request) {
  return withLearner(async (learner) => {
    await readJson(request);
    const recovery = await issueAnonymousRecoveryCode(learner);
    return json({
      recoveryCode: recovery.code,
      expiresAt: recovery.expiresAt,
      oneTimeUse: false,
    });
  });
}

export async function DELETE(request: Request) {
  return withLearner(async (learner) => {
    await readJson(request);
    return json(await revokeAnonymousRecoveryCode(learner));
  });
}
