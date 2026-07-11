import { advanceApplication, ApiError } from "../../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    return Response.json(advanceApplication(id));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка продвижения заявки" }, { status });
  }
}
