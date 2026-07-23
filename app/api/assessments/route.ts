import { json, readJson, withLearner } from "../_shared";
import { getActiveAssessment, startAssessment } from "../../enterprise/learning-service";

export async function GET(request: Request) {
  return withLearner(async (learner) => {
    const params = new URL(request.url).searchParams;
    const attempt = await getActiveAssessment(learner, params.get("kind"), params.get("moduleId"));
    return json({ attempt });
  });
}

export async function POST(request: Request) {
  return withLearner(async (learner) => {
    const result = await startAssessment(learner, await readJson(request));
    return json({ attempt: result.data, revision: result.revision, replayed: result.replayed });
  });
}
