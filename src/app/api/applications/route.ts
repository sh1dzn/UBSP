import { NextResponse } from "next/server";
import { applications, numeric, readJson } from "@/lib/mock-portal";

export async function POST(request: Request) {
  const input = await readJson(request);
  const amount = numeric(input.amount);
  const own = numeric(input.own);
  if (!/^\d{12}$/.test(String(input.bin)) || amount <= 0 || own / amount < 0.15) {
    return NextResponse.json({ message: "Заявка не прошла обязательные проверки" }, { status: 422 });
  }
  const id = `OR-2026-${String(1284 + applications.size).padStart(6, "0")}`;
  const application = {
    id,
    status: "Передано в КазАгроФинанс",
    submittedAt: new Date().toISOString(),
    nextUpdateAt: "2026-07-14",
    audit: ["EDS_MOCK_VERIFIED", "SENT_TO_BPM_MOCK"],
  };
  applications.set(id, application);
  return NextResponse.json(application, { status: 201 });
}
