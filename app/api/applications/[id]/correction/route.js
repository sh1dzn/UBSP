import { submitCorrection, ApiError } from "../../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    return Response.json(submitCorrection(id, body));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка отправки уточнений" }, { status });
  }
}
