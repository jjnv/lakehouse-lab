import { json, readJson, withLearner } from "../../../../_shared";
import { reviewLesson } from "../../../../../enterprise/learning-service";

type RouteContext = { params: Promise<{ moduleId: string; lessonId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withLearner(async (learner) => {
    const { moduleId, lessonId } = await context.params;
    return json(await reviewLesson(learner, moduleId, lessonId, await readJson(request)));
  });
}
