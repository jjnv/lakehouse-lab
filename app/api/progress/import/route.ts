import { json, readJson, withLearner } from "../../_shared";
import { importLegacyProgress } from "../../../enterprise/learning-service";

export async function POST(request: Request) {
  return withLearner(async (learner) => json(await importLegacyProgress(learner, await readJson(request))));
}
