import { json } from "../_shared";
import { searchCurriculum } from "../../enterprise/curriculum";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  return json({ query, results: searchCurriculum(query) }, {
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300", vary: "Accept-Encoding" },
  });
}
