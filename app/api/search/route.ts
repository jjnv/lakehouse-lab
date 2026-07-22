import { json, withLearner } from "../_shared";
import { searchCurriculum } from "../../enterprise/curriculum";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withLearner(async () => {
    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
    return json({ query, results: searchCurriculum(query) });
  });
}
