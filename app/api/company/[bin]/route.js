import { getCompany, ApiError } from "../../../../server/store.js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { bin } = await params;
  try {
    return Response.json(getCompany(bin));
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка проверки БИН" }, { status });
  }
}
