import { listNotifications } from "../../../server/store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ notifications: listNotifications() });
}
