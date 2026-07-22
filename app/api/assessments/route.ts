import { json, readJson, withLearner } from "../_shared";
import { startAssessment } from "../../enterprise/learning-service";

export async function POST(request: Request) {
  return withLearner(async (learner) => {
    const result = await startAssessment(learner, await readJson(request));
    return json({ attempt: result.data, revision: result.revision, replayed: result.replayed });
  });
}
