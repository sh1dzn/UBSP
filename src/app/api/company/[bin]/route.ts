import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ bin: string }> }) {
  const { bin } = await params;
  if (!/^\d{12}$/.test(bin)) {
    return NextResponse.json({ message: "БИН должен содержать 12 цифр" }, { status: 400 });
  }
  return NextResponse.json({
    verified: true,
    source: "Mock eGov registry",
    company: {
      bin,
      name: "ТОО «Astana Logistics»",
      region: "г. Астана",
      activity: "Грузовые железнодорожные перевозки",
      registeredAt: "2012-09-14",
    },
  });
}
