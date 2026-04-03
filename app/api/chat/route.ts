import { NextResponse } from "next/server";
import { buildAgentSystemPrompt } from "@/lib/agents";
import { completeConversation, type ChatTurn } from "@/lib/anthropic";
import { getErrorMessage } from "@/lib/errors";
import {
  formatMemoriesForPrompt,
  fetchRelevantMemories,
  logConversationMessage,
  loadConversationHistory,
  maybeSavePatternFromUserMessage,
} from "@/lib/fernhollow-memory";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";
import { composeVillageSquareReply } from "@/lib/village-chime";
import { isLocationSlug, LOCATIONS } from "@/lib/locations";
import type { LocationSlug } from "@/lib/locations";

export const runtime = "nodejs";

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

export async function GET(request: Request) {
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
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

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
      const memories = await fetchRelevantMemories({
        agent,
        business: meta.business ?? undefined,
        limit: 10,
        categoryHint: patternHintFromMessage(message),
      });
      const memoryBlock = formatMemoriesForPrompt(memories);
      const base = buildAgentSystemPrompt(agent, meta.location);
      const system = memoryBlock ? `${base}\n\n${memoryBlock}` : base;

      reply = await completeConversation({
        system,
        messages: anthropicMessages,
      });
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
