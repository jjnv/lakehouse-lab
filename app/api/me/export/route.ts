import { withLearner } from "../../_shared";
import { exportLearnerData } from "../../../enterprise/learning-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return withLearner(async (learner) => {
    const payload = JSON.stringify(await exportLearnerData(learner), null, 2);
    return new Response(payload, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="lakehouse-lab-expediente-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store, max-age=0",
      },
    });
  });
}
