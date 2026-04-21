import { NextResponse } from "next/server";
import { getBaseSystemPrompt } from "@/lib/agents";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";
import { completeWithSearch } from "@/lib/anthropic";
import { verifyCronRequest } from "@/lib/cron-auth";
import {
  formatFeedbackForPrompt,
  getFeedbackSummaryForAgent,
} from "@/lib/fernhollow-feedback";
import { sendChimesForBriefing } from "@/lib/fernhollow-chimes";
import { formatAutomationFailureMessage, getErrorMessage } from "@/lib/errors";
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

/** Morning briefing cron: Wren only (income / Etsy / PrintBooth focus). Re-add others when you want. */
const BRIEFING_AGENTS: Exclude<FernhollowAgent, "shared">[] = ["wren"];

function morningBriefingLayer(agent: Exclude<FernhollowAgent, "shared">): string {
  const base = `You are writing a short morning briefing for Frankie (scheduled job). Coffee on the porch with your best friend: warm, human, not a project manager. Tight paragraphs. No bullet lists. Aim under about 220 words. End with one short, concrete offer in your voice: invite Frankie to let you take a specific next step (draft something, research something, follow up, or build a small piece). Phrase it as a warm question or invitation—like asking if she wants you to handle it—not as a bullet list.`;

  switch (agent) {
    case "clover":
      return `${base} Name what matters today across Blirt, Saudade, and PrintBooth, and one gentle nudge if something needs her eyes.`;
    case "rosie":
      return `${base} Lead with feeling: what emotional tone matters for Saudade and her events today, and one sensory or heart detail if it helps.`;
    case "scout":
      return `${base} Be practical: what actually needs doing today for PrintBooth and vendors, and one clear priority if something is stuck.`;
    case "wren":
      return `${base} Focus on income and the village fund: wins, numbers if relevant, what needs her OK before you move forward. You have access to web search — use it to find ONE specific trending product opportunity on Etsy or a content gap you spotted. Give Frankie a concrete brief: what the product is, why it will sell, estimated price point, and what you need from her to move forward. Be specific, be excited, back it up with what you found.`;
    default:
      return base;
  }
}

/** Daily ~8am CT (14:00 UTC): Wren drafts the morning briefing (draft row). */
export async function GET(request: Request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? "Forbidden" },
      { status: 401 },
    );
  }

  const month = currentMonthString();
  const rows = await listTreasuryForMonth(month);
  const totals = summarizeTreasury(rows);

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

  type OkRow = {
    agent: string;
    contentId: string;
    taskId: string;
  };
  type ErrRow = { agent: string; error: string };
  const results: (OkRow | ErrRow)[] = [];

  for (let i = 0; i < BRIEFING_AGENTS.length; i++) {
    const agent = BRIEFING_AGENTS[i];
    let taskId: string | null = null;
    try {
      const { id } = await startTask({
        agent,
        taskType: "morning_briefing",
        business: null,
      });
      taskId = id;

      const memories = await fetchRelevantMemories({
        agent,
        limit: 10,
      });
      const memoryBlock = formatMemoriesForPrompt(memories);

      const feedbackSummary = await getFeedbackSummaryForAgent(agent);
      const feedbackBlock = formatFeedbackForPrompt(agent, feedbackSummary);

      const system = `${getBaseSystemPrompt(agent)}\n\n${morningBriefingLayer(agent)}`;

      const fullSystem = [
        system,
        memoryBlock,
        feedbackBlock,
        `Context:\n${context}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const briefing = await completeWithSearch({
        system: fullSystem,
        messages: [
          {
            role: "user",
            content:
              "Write today's morning briefing for Frankie from your perspective (no em-dashes).",
          },
        ],
        maxTokens: 700,
        /** Daily cron: Anthropic often returns 529 when four Sonnet+search calls run close together. */
        maxRetries: 10,
      });

      const { data: content, error: insErr } = await supabase
        .from("fernhollow_content")
        .insert({
          agent,
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

      results.push({
        agent,
        contentId: content.id as string,
        taskId,
      });

      // Chimes are best-effort — a chime failure should not mark the briefing as failed.
      try {
        await sendChimesForBriefing({
          fromAgent: agent,
          briefingContent: briefing,
          sourceContentId: content.id as string,
        });
      } catch (chimeErr) {
        console.error(`morning-briefing:${agent}:chimes`, chimeErr);
      }
    } catch (e) {
      console.error(`morning-briefing:${agent}`, e);
      const rawMsg = getErrorMessage(e);
      if (taskId) await failTask(taskId, rawMsg);
      results.push({
        agent,
        error: formatAutomationFailureMessage(rawMsg),
      });
    }

    /* Space out when multiple agents run (unused while Wren-only). */
    if (i < BRIEFING_AGENTS.length - 1) {
      await new Promise((r) => setTimeout(r, 5200));
    }
  }

  const failures = results.filter((r): r is ErrRow => "error" in r);
  const allFailed = failures.length === BRIEFING_AGENTS.length;

  return NextResponse.json(
    {
      ok: failures.length === 0,
      results,
      /** Who ran this cron (verify in Vercel logs if you still see other girls’ morning tasks). */
      briefingAgents: BRIEFING_AGENTS,
    },
    { status: allFailed ? 500 : 200 },
  );
}
