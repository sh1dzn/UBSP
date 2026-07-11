import { submitStage, ApiError } from "../../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const { stageId, answers } = body || {};
    return Response.json(submitStage(id, { stageId, answers }));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка отправки этапа" }, { status });
  }
}
