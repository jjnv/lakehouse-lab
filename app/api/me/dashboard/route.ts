import { json, withLearner } from "../../_shared";
import { getLearnerDashboard } from "../../../enterprise/learning-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return withLearner(async (learner) => json(await getLearnerDashboard(learner)));
}
