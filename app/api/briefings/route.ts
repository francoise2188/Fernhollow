import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { readAuthFromCookies } from "@/lib/auth";

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "draft";

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("fernhollow_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status === "archive") {
    query = query.in("status", ["approved", "dismissed"]);
  } else {
    query = query.eq("status", "draft");
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ briefings: data });
}
