import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { fetchGardenContentRows } from "@/lib/garden-data";

export async function GET() {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
