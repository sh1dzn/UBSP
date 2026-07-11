import { checkEligibility, ApiError } from "../../../server/store.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { serviceId, answers } = body || {};
    return Response.json(checkEligibility(serviceId, answers));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка проверки соответствия" }, { status });
  }
}
