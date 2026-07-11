import { NextResponse } from "next/server";
import { numeric, readJson } from "@/lib/mock-portal";

export async function POST(request: Request) {
  const input = await readJson(request);
  const amount = numeric(input.amount);
  const own = numeric(input.own);
  if (amount <= 0 || own < 0 || own > amount) return NextResponse.json({ message: "Проверьте стоимость и собственные средства" }, { status: 400 });
  const financed = amount - own;
  const advancePercent = Math.round((own / amount) * 1000) / 10;
  return NextResponse.json({ financed, advancePercent, estimatedMonthly: Math.round((financed * 1.09) / 84), minimumMet: advancePercent >= 15, currency: "KZT" });
}
