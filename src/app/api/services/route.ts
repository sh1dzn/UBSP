import { NextResponse } from "next/server";
import { serviceCatalog } from "@/lib/mock-portal";

export function GET() {
  return NextResponse.json({ services: serviceCatalog });
}
