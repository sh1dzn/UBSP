import { listApplications, createApplication, ApiError } from "../../../server/store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ applications: listApplications() });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { serviceId, stageId, answers, applicant } = body || {};
    const app = createApplication({ serviceId, stageId, answers, applicant });
    return Response.json(app);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return Response.json({ message: err.message || "Ошибка создания заявки" }, { status });
  }
}
