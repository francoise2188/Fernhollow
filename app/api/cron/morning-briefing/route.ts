import { NextResponse } from "next/server";
import { getBaseSystemPrompt } from "@/lib/agents";
import { completeConversation } from "@/lib/anthropic";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getErrorMessage } from "@/lib/errors";
import { completeTask, failTask, startTask } from "@/lib/fernhollow-tasks";
import {
  fetchRelevantMemories,
  formatMemoriesForPrompt,
} from "@/lib/fernhollow-memory";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  currentMonthString,
  listTreasuryForMonth,
  summarizeTreasury,
  formatUsd,
} from "@/lib/treasury";

export const runtime = "nodejs";

/** Daily ~8am CT: Clover drafts a morning briefing (draft content). */
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
      taskType: "morning_briefing",
      business: null,
    });
    taskId = id;

    const month = currentMonthString();
    const rows = await listTreasuryForMonth(month);
    const totals = summarizeTreasury(rows);
    const memories = await fetchRelevantMemories({
      agent: "clover",
      limit: 10,
    });
    const memoryBlock = formatMemoriesForPrompt(memories);

    const supabase = getSupabaseAdmin();
    const { count: draftCount } = await supabase
      .from("fernhollow_content")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft");

    const context = [
      `Calendar month: ${month}`,
      `Treasury net so far: ${formatUsd(totals.net_cents)} (income ${formatUsd(totals.income_cents)}, expenses ${formatUsd(totals.expense_cents)})`,
      `Draft posts in the queue (approx): ${draftCount ?? 0}`,
    ].join("\n");

    const system = `${getBaseSystemPrompt("clover")}

You are writing a short morning briefing for Frankie (scheduled job). Coffee on the porch with your best friend: warm, human, not a project manager. Tight paragraphs. No bullet lists. Name what matters today across Blirt, Saudade, and PrintBooth, and one gentle nudge if something needs her eyes. Aim under about 220 words.`;

    const fullSystem = memoryBlock
      ? `${system}\n\n${memoryBlock}\n\nContext:\n${context}`
      : `${system}\n\nContext:\n${context}`;

    const briefing = await completeConversation({
      system: fullSystem,
      messages: [
        {
          role: "user",
          content:
            "Write today's morning briefing for Frankie (no em-dashes).",
        },
      ],
      maxTokens: 700,
    });

    const { data: content, error: insErr } = await supabase
      .from("fernhollow_content")
      .insert({
        agent: "clover",
        business: "fernhollow",
        content_type: "email",
        platform: null,
        content: briefing,
        status: "draft",
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    const summary = `Morning briefing draft saved. Content id: ${content.id as string}`;
    await completeTask(taskId, summary);

    return NextResponse.json({
      ok: true,
      contentId: content.id,
      taskId,
    });
  } catch (e) {
    console.error(e);
    const msg = getErrorMessage(e);
    if (taskId) await failTask(taskId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
