import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    integrations: { registry: "mock", bpm: "mock", eds: "mock" },
    serviceCount: 72,
  });
}
