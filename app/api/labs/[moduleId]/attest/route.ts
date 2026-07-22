import { json, readJson, withLearner } from "../../../_shared";
import { attestLab } from "../../../../enterprise/learning-service";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withLearner(async (learner) => {
    const { moduleId } = await context.params;
    return json(await attestLab(learner, moduleId, await readJson(request)));
  });
}
