import { listServices, saveService, ApiError } from "../../../server/store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ services: listServices() });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const saved = saveService(body);
    return Response.json(saved);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка сохранения услуги" }, { status });
  }
}
