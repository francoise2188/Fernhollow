import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  const note = typeof body.note === "string" ? body.note : undefined;
  const stopSuggesting =
    typeof body.stopSuggesting === "boolean" ? body.stopSuggesting : false;

  if (!["approved", "dismissed"].includes(status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: briefing, error: updateError } = await supabase
    .from("fernhollow_content")
    .update({ status: status as "approved" | "dismissed" })
    .eq("id", id)
    .select("agent, content_type, business")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: feedbackError } = await supabase.from("fernhollow_feedback").insert({
    agent: briefing.agent,
    content_id: id,
    action: status,
    note: note ?? null,
    content_type: briefing.content_type,
    business: briefing.business,
    stop_suggesting: stopSuggesting ?? false,
  });

  if (feedbackError) console.error("Feedback save error:", feedbackError);

  return NextResponse.json({ ok: true });
}
