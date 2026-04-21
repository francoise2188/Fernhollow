import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { triggerContentPipeline } from "@/lib/content-pipeline";
import { syncApprovedWrenEmailBriefingToHouseChat } from "@/lib/sync-approved-wren-briefing";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Permanently remove a content row (e.g. clear clutter from Archive without changing approve/dismiss). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("fernhollow_content").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    status?: string;
    note?: string | null;
    stopSuggesting?: boolean;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, note, stopSuggesting } = body;

  if (!status || !["approved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: briefing, error: updateError } = await supabase
    .from("fernhollow_content")
    .update({ status: status as "approved" | "dismissed" })
    .eq("id", id)
    .select("id, agent, content_type, business, content")
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

  // Only morning briefings (email) should spawn follow-up drafts; not images or pipeline outputs.
  if (status === "approved" && briefing.content_type === "email") {
    if (briefing.agent === "wren") {
      void syncApprovedWrenEmailBriefingToHouseChat({
        content: briefing.content,
      });
    }
    void triggerContentPipeline(briefing);
  }

  return NextResponse.json({ ok: true });
}
