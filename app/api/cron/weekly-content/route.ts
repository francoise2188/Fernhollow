import { NextResponse } from "next/server";
import { getBaseSystemPrompt } from "@/lib/agents";
import { completeWithSearch } from "@/lib/anthropic";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getErrorMessage } from "@/lib/errors";
import { completeTask, failTask, startTask } from "@/lib/fernhollow-tasks";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function splitWeeklyBlocks(text: string): {
  blirt: string;
  saudade: string;
  printbooth: string;
} {
  const pick = (label: string) => {
    const re = new RegExp(
      `===${label}===\\s*([\\s\\S]*?)(?====|$)`,
      "i",
    );
    const m = text.match(re);
    return m?.[1]?.trim() ?? "";
  };
  return {
    blirt: pick("BLIRT"),
    saudade: pick("SAUDADE"),
    printbooth: pick("PRINTBOOTH"),
  };
}

/** Sunday batch: one orchestrated draft with three labeled sections, saved as three rows. */
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
      agent: "clover",
      taskType: "weekly_content",
      business: null,
    });
    taskId = id;

    const system = `${getBaseSystemPrompt("clover")}

You are running the weekly content batch for Fernhollow. Produce draft ideas for the week ahead (social-first, Frankie's voice). Output exactly three sections:

===BLIRT===
(2-4 short ideas for Blirt / events / QR guest messages)

===SAUDADE===
(2-4 short ideas for Saudade / keepsakes / Austin events)

===PRINTBOOTH===
(2-4 short ideas for PrintBooth Vendors / community / education)

No bullet lists. No em-dashes. Plain language.`;

    const raw = await completeWithSearch({
      system,
      messages: [
        {
          role: "user",
          content:
            "Write this week's batch. Keep each section tight and usable as drafts.",
        },
      ],
      maxTokens: 1200,
    });

    const parts = splitWeeklyBlocks(raw);
    const supabase = getSupabaseAdmin();
    const inserts = [
      {
        agent: "clover" as const,
        business: "blirt" as const,
        body: parts.blirt || raw.slice(0, 1200),
      },
      {
        agent: "rosie" as const,
        business: "saudade" as const,
        body: parts.saudade || "",
      },
      {
        agent: "scout" as const,
        business: "printbooth" as const,
        body: parts.printbooth || "",
      },
    ];

    const ids: string[] = [];
    for (const row of inserts) {
      if (!row.body.trim()) continue;
      const { data, error } = await supabase
        .from("fernhollow_content")
        .insert({
          agent: row.agent,
          business: row.business,
          content_type: "caption",
          platform: "instagram",
          content: row.body,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      ids.push(data.id as string);
    }

    if (ids.length === 0) {
      const { data, error } = await supabase
        .from("fernhollow_content")
        .insert({
          agent: "clover",
          business: "fernhollow",
          content_type: "blog",
          platform: null,
          content: raw,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      ids.push(data.id as string);
    }

    const out = `Weekly batch saved. Content ids: ${ids.join(", ")}`;
    await completeTask(taskId, out);

    return NextResponse.json({ ok: true, contentIds: ids, taskId });
  } catch (e) {
    console.error(e);
    const msg = getErrorMessage(e);
    if (taskId) await failTask(taskId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
