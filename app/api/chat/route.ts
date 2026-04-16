import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import {
  completeConversation,
  completeWithTools,
  completeWithSearch,
  type ChatTurn,
} from "@/lib/anthropic";
import { buildAgentSystemPrompt } from "@/lib/agents";
import { getErrorMessage } from "@/lib/errors";
import { generateImage, imageToContentRow } from "@/lib/image-gen";
import {
  getFrankieGlobalPromptBlock,
  getRecapPromptBlockForAgent,
} from "@/lib/frankie-preferences";
import {
  formatMemoriesForPrompt,
  fetchRelevantMemories,
  logConversationMessage,
  loadConversationHistory,
  maybeSavePatternFromUserMessage,
} from "@/lib/fernhollow-memory";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";
import {
  formatFeedbackForPrompt,
  getFeedbackSummaryForAgent,
} from "@/lib/fernhollow-feedback";
import { composeVillageSquareReply } from "@/lib/village-chime";
import { isLocationSlug, LOCATIONS } from "@/lib/locations";
import type { LocationSlug } from "@/lib/locations";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  currentMonthString,
  formatUsd,
  listTreasuryForMonth,
  summarizeTreasury,
} from "@/lib/treasury";

export const runtime = "nodejs";
const WREN_IMAGE_COOLDOWN_MS = 15_000;
const wrenImageCooldownBySession = new Map<string, number>();

function toAnthropicMessages(
  rows: Array<{ role: string; content: string }>,
): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const m of rows) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    out.push({ role: m.role, content: m.content });
  }
  const sliced = out.slice(-40);
  while (sliced.length > 0 && sliced[0].role !== "user") {
    sliced.shift();
  }
  return sliced;
}

function patternHintFromMessage(message: string): "pattern" | undefined {
  return /\b(sunday|tiktok|always|every week|pattern|recurring)\b/i.test(
    message,
  )
    ? "pattern"
    : undefined;
}

function messageNeedsWebSearch(message: string): boolean {
  const searchTriggers = [
    "trending",
    "latest",
    "current",
    "right now",
    "today",
    "this week",
    "this month",
    "recent",
    "news",
    "research",
    "find",
    "search",
    "look up",
    "what's happening",
    "stats",
    "data",
    "numbers",
    "how much",
    "how many",
    "price",
    "compare",
    "competition",
    "competitor",
    "market",
    "2025",
    "2026",
    "april",
    "january",
    "february",
    "march",
    // Phrases people use when they expect live lookup (incl. Wren / Etsy / income chats)
    "browse the",
    "on the internet",
    "on the web",
    "look it up",
    "google",
    "can you find",
    "search for",
    "search the",
    "get the info",
    "look online",
    "real time",
    "live data",
    "right now on",
    "what are people",
    "what is selling",
  ];
  const lower = message.toLowerCase();
  return searchTriggers.some((trigger) => lower.includes(trigger));
}

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    const messages = await loadConversationHistory(sessionId);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error(e);
    const detail = getErrorMessage(e);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev ? detail : "Could not load chat history.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const raw = body as Record<string, unknown>;
  const briefingContext =
    typeof raw.briefingContext === "string" ? raw.briefingContext.trim() : "";

  if (!sessionId || !message || !slug) {
    return NextResponse.json(
      { error: "sessionId, message, and slug are required" },
      { status: 400 },
    );
  }

  if (!isLocationSlug(slug)) {
    return NextResponse.json({ error: "Unknown place" }, { status: 400 });
  }

  const meta = LOCATIONS[slug as LocationSlug];
  if (!meta.hasChat) {
    return NextResponse.json(
      { error: "Chat is not open in this place yet." },
      { status: 400 },
    );
  }

  const agent = meta.agent as FernhollowAgent;

  try {
    await logConversationMessage({
      agent,
      role: "user",
      content: message,
      sessionId,
      location: meta.location,
      business: meta.business ?? undefined,
    });

    const history = await loadConversationHistory(sessionId);
    const anthropicMessages = toAnthropicMessages(history);

    let reply: string;

    if (meta.location === "village_square") {
      reply = await composeVillageSquareReply({
        userMessage: message,
        anthropicMessages,
      });
    } else {
      const memoriesRaw = await fetchRelevantMemories({
        agent,
        business: meta.business ?? undefined,
        limit: 10,
        categoryHint: patternHintFromMessage(message),
      });
      const memories = memoriesRaw.filter(
        (m) => !String(m.key).startsWith("frankie_recap_"),
      );
      const frankieBlock = await getFrankieGlobalPromptBlock();
      const recapBlock = await getRecapPromptBlockForAgent(agent);
      const memoryBlock = formatMemoriesForPrompt(memories);
      const feedbackSummary = await getFeedbackSummaryForAgent(agent);
      const feedbackBlock = formatFeedbackForPrompt(agent, feedbackSummary);

      let treasuryBlock = "";
      if (slug === "wrens-house") {
        try {
          const month = currentMonthString();
          const rows = await listTreasuryForMonth(month);
          const totals = summarizeTreasury(rows);
          treasuryBlock = `Village fund snapshot for ${month} (same numbers as your dashboard): net ${formatUsd(totals.net_cents)}, income ${formatUsd(totals.income_cents)}, expenses ${formatUsd(totals.expense_cents)}. Treat these as the current real totals unless Frankie says otherwise.`;
        } catch {
          treasuryBlock = "";
        }
      }

      const base = buildAgentSystemPrompt(agent, meta.location);
      const systemWithContext = briefingContext
        ? `${base}\n\nIMPORTANT CONTEXT: You wrote the following in your morning briefing today. You know this because YOU wrote it. When Frankie references it, respond as if you remember writing it:\n\n"${briefingContext}"`
        : base;
      const system = [
        frankieBlock,
        recapBlock,
        memoryBlock,
        feedbackBlock,
        treasuryBlock,
        systemWithContext,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (agent === "wren") {
        const needsSearch = messageNeedsWebSearch(message);
        if (needsSearch) {
          const searchAwareSystem = `${system}

WEB SEARCH (this turn):
You have Anthropic's web_search tool for this reply. When Frankie asks for current facts, prices, trends, Etsy/market info, or anything that needs up-to-date sources, use web_search before answering — then summarize what you found in your own words. Do not say you cannot browse the web during this turn.`;
          reply = await completeWithSearch({
            system: searchAwareSystem,
            messages: anthropicMessages,
            maxTokens: 4096,
          });
        } else {
        const toolAwareSystem = `${system}

TOOL POLICY FOR IMAGE REQUESTS:
If Frankie asks you to generate, create, make, design, mockup, or produce an image/template right now, you MUST call the generate_image tool.
Never claim an image was generated unless the tool result explicitly confirms success and provides a URL.`;
        reply = await completeWithTools({
          system: toolAwareSystem,
          messages: anthropicMessages,
          onToolUse: async (toolName, toolInput) => {
            if (toolName === "generate_image") {
              try {
                const now = Date.now();
                const last = wrenImageCooldownBySession.get(sessionId) ?? 0;
                const remaining = WREN_IMAGE_COOLDOWN_MS - (now - last);
                if (remaining > 0) {
                  return `Image generation is cooling down. Please wait about ${Math.ceil(remaining / 1000)}s before generating another image.`;
                }
                const prompt =
                  typeof toolInput.prompt === "string" ? toolInput.prompt : "";
                if (!prompt.trim()) {
                  return "Image generation failed: missing prompt.";
                }
                const width =
                  typeof toolInput.width === "number" ? toolInput.width : 1024;
                const height =
                  typeof toolInput.height === "number" ? toolInput.height : 1024;
                const business =
                  typeof toolInput.business === "string"
                    ? toolInput.business
                    : "fernhollow";

                const images = await generateImage({
                  prompt,
                  width,
                  height,
                  numImages: 1,
                });

                const image = images[0];
                if (!image) return "Image generation failed — no image returned.";

                const supabase = getSupabaseAdmin();
                const row = imageToContentRow({
                  agent: "wren",
                  business,
                  imageUrl: image.url,
                  prompt,
                  platform: "etsy",
                });

                const { data } = await supabase
                  .from("fernhollow_content")
                  .insert(row)
                  .select("id")
                  .single();
                wrenImageCooldownBySession.set(sessionId, now);

                return `Image generated successfully! Saved to your village square for approval.\n\n![Generated design](${image.url})\n\nContent ID: ${data?.id ?? "unknown"}. The image is ready to review!`;
              } catch (e) {
                return `Image generation failed: ${e instanceof Error ? e.message : "Unknown error"}`;
              }
            }
            return "Unknown tool.";
          },
        });
        }
      } else {
        const needsSearch = messageNeedsWebSearch(message);
        reply = needsSearch
          ? await completeWithSearch({ system, messages: anthropicMessages })
          : await completeConversation({ system, messages: anthropicMessages });
      }
    }

    await logConversationMessage({
      agent,
      role: "assistant",
      content: reply,
      sessionId,
      location: meta.location,
      business: meta.business ?? undefined,
    });

    void maybeSavePatternFromUserMessage(message);

    return NextResponse.json({ reply });
  } catch (e) {
    console.error(e);
    const detail = getErrorMessage(e);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev
          ? detail
          : "Something went wrong sending your message.",
      },
      { status: 500 },
    );
  }
}
