import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import {
  flattenBriefingContentForPrompt,
  generateCraftRoomClipboardPrompt,
} from "@/lib/craft-room-prompt";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    contentId?: string;
  } | null;
  if (!body?.contentId || typeof body.contentId !== "string") {
    return NextResponse.json({ error: "Missing contentId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("fernhollow_content")
    .select("agent, business, content_type, content")
    .eq("id", body.contentId)
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: 404 },
    );
  }

  const flatContent = flattenBriefingContentForPrompt(
    row.content as string,
    row.content_type as string,
  );

  try {
    const prompt = await generateCraftRoomClipboardPrompt({
      agent: row.agent as string,
      business: row.business as string,
      contentType: row.content_type as string,
      flatContent,
    });
    return NextResponse.json({ prompt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
