import Anthropic from "@anthropic-ai/sdk";
import { getErrorMessage } from "@/lib/errors";

/**
 * Default: Claude Sonnet 4 (direct Anthropic API).
 * Older ids like claude-3-5-sonnet-20240620 may return 404 — use ANTHROPIC_MODEL to override.
 */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export type ChatTurn = { role: "user" | "assistant"; content: string };

function normalizeApiKey(raw: string): string {
  return raw.replace(/\r/g, "").replace(/\n/g, "").trim();
}

export async function completeConversation(input: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}): Promise<string> {
  const key = normalizeApiKey(process.env.ANTHROPIC_API_KEY ?? "");
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY (check .env.local is a single line, no accidental line breaks).",
    );
  }

  if (input.messages.length === 0) {
    throw new Error("No messages to send to Claude (chat history may not have saved).");
  }

  const model = (process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL)
    .replace(/\r/g, "")
    .trim();

  const client = new Anthropic({ apiKey: key });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: input.maxTokens ?? 4096,
      system: input.system,
      messages: input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Unexpected Anthropic response shape");
    }
    return block.text;
  } catch (e) {
    const base = getErrorMessage(e);
    if (
      base.includes("model") ||
      base.includes("404") ||
      base.includes("not_found")
    ) {
      throw new Error(
        `${base} — Set ANTHROPIC_MODEL in .env.local to a model your key can use (e.g. claude-sonnet-4-20250514 or claude-3-5-haiku-20241022), then restart npm run dev.`,
      );
    }
    throw new Error(base);
  }
}
