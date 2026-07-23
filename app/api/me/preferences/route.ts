import { json, readJson, withLearner } from "../../_shared";
import { updateLearnerPreferences } from "../../../enterprise/learning-service";

export async function PUT(request: Request) {
  return withLearner(async (learner) => {
    const result = await updateLearnerPreferences(learner, await readJson(request));
    return json(result);
  });
}
