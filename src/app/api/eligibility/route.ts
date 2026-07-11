import { NextResponse } from "next/server";
import { numeric, readJson, serviceCatalog } from "@/lib/mock-portal";

export async function POST(request: Request) {
  const input = await readJson(request);
  const service = serviceCatalog.find((item) => item.id === (input.serviceId || "wagons"));
  if (!service) return NextResponse.json({ message: "Мера поддержки не найдена" }, { status: 404 });

  const amount = numeric(input.amount);
  const own = numeric(input.own);
  const advancePercent = amount > 0 ? Math.round((own / amount) * 1000) / 10 : 0;
  const checks = [
    { id: "registry", passed: /^\d{12}$/.test(String(input.bin)), label: "Компания найдена в реестре" },
    { id: "advance", passed: advancePercent >= (service.minAdvance || 0), label: `Аванс не ниже ${service.minAdvance || 0}%` },
    { id: "valuation", passed: input.used !== "used", warning: input.used === "used", label: input.used === "used" ? "Нужен отчёт об оценке вагонов" : "Дополнительная оценка не требуется" },
  ];
  const eligible = checks.slice(0, 2).every((check) => check.passed);
  return NextResponse.json({
    score: Math.round((checks.filter((check) => check.passed).length / checks.length) * 100),
    eligible,
    checks,
    nextAction: advancePercent < (service.minAdvance || 0) ? "Увеличьте собственное участие" : "Можно отправлять предварительную заявку",
  });
}
