import { aiMatch, ApiError } from "../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { query, profile } = body || {};
    return Response.json(aiMatch({ query, profile }));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка AI-подбора" }, { status });
  }
}
