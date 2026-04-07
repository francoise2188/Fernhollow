import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { briefToContentRow, type CanvaDesignBrief } from "@/lib/canva";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brief = (await request.json()) as CanvaDesignBrief;

  if (!brief.title || !brief.business || !brief.productType) {
    return NextResponse.json({ error: "Missing required brief fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const row = briefToContentRow(brief);

  const { data, error } = await supabase
    .from("fernhollow_content")
    .insert(row)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, contentId: data.id });
}
