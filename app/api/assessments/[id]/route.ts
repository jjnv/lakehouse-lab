import { json, readJson, withLearner } from "../../_shared";
import { saveAssessmentSelections } from "../../../enterprise/learning-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withLearner(async (learner) => {
    const { id } = await context.params;
    const result = await saveAssessmentSelections(learner, id, await readJson(request));
    return json({ attempt: result.data, revision: result.revision, replayed: result.replayed });
  });
}
