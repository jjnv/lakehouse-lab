import { json, readJson, withLearner } from "../../_shared";
import { getPlaygroundOverview, saveScenarioAttempt } from "../../../enterprise/playground-service";

export const dynamic = "force-dynamic";

/** Resumen privado del Playground de la sesión actual. */
export async function GET() {
  return withLearner(async (learner) => json(await getPlaygroundOverview(learner)));
}

/** Guarda un intento terminado; el servidor recalcula la evaluación. */
export async function POST(request: Request) {
  return withLearner(async (learner) => {
    const result = await saveScenarioAttempt(learner, await readJson(request));
    return json(result, { status: result.replayed ? 200 : 201 });
  });
}
