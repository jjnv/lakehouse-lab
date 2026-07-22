import { withLearner } from "../../../_shared";
import { getCredentialForLearner, renderCredentialPdf } from "../../../../enterprise/learning-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withLearner(async (learner) => {
    const { id } = await context.params;
    const credential = await getCredentialForLearner(learner, id);
    const rendered = await renderCredentialPdf(learner, credential);
    const body = new Uint8Array(rendered.byteLength);
    body.set(rendered);
    return new Response(body.buffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="certificado-${credential.verificationCode.replace(/[^A-Za-z0-9-]/gu, "")}.pdf"`,
        "cache-control": "private, no-store, max-age=0",
      },
    });
  });
}
