import { json } from "../../../_shared";
import { loadCommunityNotebookPreview, NotebookPreviewError } from "../../../../enterprise/notebook-preview";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  const { resourceId } = await params;
  try {
    return json(await loadCommunityNotebookPreview(resourceId), {
      headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400", vary: "Accept-Encoding" },
    });
  } catch (error) {
    if (error instanceof NotebookPreviewError) {
      return json({
        code: error.code,
        message: error.message,
        retryable: error.status >= 500,
      }, { status: error.status });
    }
    return json({
      code: "PREVIEW_FAILED",
      message: "No se pudo preparar la vista de lectura.",
      retryable: true,
    }, { status: 500 });
  }
}
