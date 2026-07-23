import { json, withLearner } from "../../../_shared";
import { LearningApiError } from "../../../../enterprise/learning-service";
import { loadCommunityNotebookPreview, NotebookPreviewError } from "../../../../enterprise/notebook-preview";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  return withLearner(async () => {
    const { resourceId } = await params;
    try {
      return json(await loadCommunityNotebookPreview(resourceId));
    } catch (error) {
      if (error instanceof NotebookPreviewError) {
        throw new LearningApiError(error.status, error.code, error.message, error.status >= 500);
      }
      throw error;
    }
  });
}
