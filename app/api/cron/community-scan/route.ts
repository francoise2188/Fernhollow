import { NextResponse } from "next/server";
import { getBaseSystemPrompt } from "@/lib/agents";
import { completeWithHaiku } from "@/lib/anthropic";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getErrorMessage } from "@/lib/errors";
import { completeTask, failTask, startTask } from "@/lib/fernhollow-tasks";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Weekly: Scout drafts a community note for PrintBooth vendors.
 * Live Facebook group API is not wired yet; this still surfaces recurring themes to watch for.
 */
export async function GET(request: Request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? "Forbidden" },
      { status: 401 },
    );
  }

  let taskId: string | null = null;
  try {
    const { id } = await startTask({
      agent: "scout",
      taskType: "community_scan",
      business: "printbooth",
    });
    taskId = id;

    const system = `${getBaseSystemPrompt("scout")}

You are drafting a weekly community scan note for Frankie's PrintBooth / vendor world. Facebook group API is not connected yet, so you cannot see live posts. Instead: name 4-6 recurring question themes vendors usually ask (pricing, paper, setup, magnets, events, software), and one practical suggestion for Frankie to answer or pin this week. Short. No bullet lists. No em-dashes. Plain language.`;

    const note = await completeWithHaiku({
      system,
      messages: [
        {
          role: "user",
          content:
            "Write this week's community scan draft for Frankie to review before posting.",
        },
      ],
      maxTokens: 400,
    });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("fernhollow_content")
      .insert({
        agent: "scout",
        business: "printbooth",
        content_type: "fb_post",
        platform: "facebook",
        content: note,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) throw error;

    const summary = `Community scan draft saved. Content id: ${data.id as string}`;
    await completeTask(taskId, summary);

    return NextResponse.json({
      ok: true,
      contentId: data.id,
      taskId,
    });
  } catch (e) {
    console.error(e);
    const msg = getErrorMessage(e);
    if (taskId) await failTask(taskId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
