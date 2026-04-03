import { NextResponse } from "next/server";
import { fetchGardenContentRows } from "@/lib/garden-data";

export async function GET() {
  try {
    const rows = await fetchGardenContentRows();
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json(
      { error: "Could not load the garden." },
      { status: 500 },
    );
  }
}
