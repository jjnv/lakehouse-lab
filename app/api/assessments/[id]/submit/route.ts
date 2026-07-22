import { json, readJson, withLearner } from "../../../_shared";
import { submitAssessment } from "../../../../enterprise/learning-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withLearner(async (learner) => {
    const { id } = await context.params;
    const result = await submitAssessment(learner, id, await readJson(request));
    return json({ result: result.data, revision: result.revision, replayed: result.replayed });
  });
}
