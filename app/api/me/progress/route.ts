import { json, readJson, withLearner } from "../../_shared";
import { deleteLearnerProgress } from "../../../enterprise/learning-service";

export async function DELETE(request: Request) {
  return withLearner(async (learner) => json(await deleteLearnerProgress(learner, await readJson(request))));
}
