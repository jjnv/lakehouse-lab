import { json } from "../_shared";
import { searchCurriculum } from "../../enterprise/curriculum";
import { localeFromValue } from "../../i18n/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 100) ?? "";
  const locale = localeFromValue(params.get("lang"));
  return json({ query, locale, results: searchCurriculum(query, locale) }, {
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300", vary: "Accept-Encoding" },
  });
}
