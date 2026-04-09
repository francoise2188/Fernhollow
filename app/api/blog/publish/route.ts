import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { publishBlogPost, type BlogTarget } from "@/lib/blog";
import { getSupabaseAdmin } from "@/lib/supabase";

function isBlogTarget(v: unknown): v is BlogTarget {
  return v === "blirt" || v === "printbooth";
}

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    contentId?: string;
    blogId?: string;
    target?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { contentId, blogId, target } = body;
  if (
    typeof contentId !== "string" ||
    typeof blogId !== "string" ||
    !isBlogTarget(target)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid contentId, blogId, or target" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: contentRow, error: fetchError } = await supabase
    .from("fernhollow_content")
    .select("agent, content_type, business")
    .eq("id", contentId)
    .single();

  if (fetchError || !contentRow) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Content not found" },
      { status: 404 },
    );
  }

  try {
    await publishBlogPost(target, blogId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("fernhollow_content")
    .update({ status: "approved", posted_at: new Date().toISOString() })
    .eq("id", contentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: feedbackError } = await supabase.from("fernhollow_feedback").insert({
    agent: contentRow.agent,
    content_id: contentId,
    action: "published",
    note: `Published live to ${target} (remote blog post id: ${blogId}).`,
    content_type: contentRow.content_type,
    business: contentRow.business,
    stop_suggesting: false,
  });

  if (feedbackError) {
    console.error("Feedback save error after blog publish:", feedbackError);
    return NextResponse.json({ error: feedbackError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
