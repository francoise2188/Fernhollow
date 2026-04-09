import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw = parseInt(searchParams.get("limit") ?? "100", 10);
  const limit = Number.isFinite(raw)
    ? Math.min(Math.max(raw, 1), 100)
    : 100;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_chimes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chimes: data });
}
