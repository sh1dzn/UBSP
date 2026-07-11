import { getService, ApiError } from "../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    return Response.json(getService(id));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка получения услуги" }, { status });
  }
}
