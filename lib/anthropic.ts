import Anthropic from "@anthropic-ai/sdk";
import { getErrorMessage } from "@/lib/errors";

/**
 * Default: Claude Sonnet 4 (direct Anthropic API).
 * Older ids like claude-3-5-sonnet-20240620 may return 404 — use ANTHROPIC_MODEL to override.
 */
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ImageTool = {
  type: "custom";
  name: "generate_image";
  description: string;
  input_schema: object;
};

export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type TextBlock = {
  type: "text";
  text: string;
};

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

export async function completeWithSearch(input: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}): Promise<string> {
  const key = normalizeApiKey(process.env.ANTHROPIC_API_KEY ?? "");
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

  const model = (process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL)
    .replace(/\r/g, "")
    .trim();

  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model,
    max_tokens: input.maxTokens ?? 4096,
    system: input.system,
    messages: input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      } as unknown as Anthropic.Tool,
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n\n");

  if (!text) throw new Error("No text in Anthropic response");
  return text;
}

/**
 * Fast, cheap model for simple inter-agent communication.
 * Use for girl-to-girl handoffs, not complex research or chat.
 */
export async function completeWithHaiku(input: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}): Promise<string> {
  const key = normalizeApiKey(process.env.ANTHROPIC_API_KEY ?? "");
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

  const client = new Anthropic({ apiKey: key });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: input.maxTokens ?? 300,
    system: input.system,
    messages: input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  if (!block || block.type !== "text") throw new Error("Unexpected response");
  return block.text;
}

/**
 * Chat with tool-use support for image generation.
 * Handles the full tool-use loop automatically.
 */
export async function completeWithTools(input: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  onToolUse?: (
    name: string,
    toolInput: Record<string, unknown>,
  ) => Promise<string>;
}): Promise<string> {
  const key = normalizeApiKey(process.env.ANTHROPIC_API_KEY ?? "");
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

  const model = (process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL)
    .replace(/\r/g, "")
    .trim();

  const client = new Anthropic({ apiKey: key });

  const tools: Anthropic.Tool[] = [
    {
      type: "custom",
      name: "generate_image",
      description:
        "Generate an image using AI. Use this when Frankie asks you to create a design, mockup, or visual. Always describe what you're generating before calling this tool. Each image costs approximately $0.01.",
      input_schema: {
        type: "object" as const,
        properties: {
          prompt: {
            type: "string",
            description:
              "Detailed description of the image to generate. Be specific about style, colors, layout, and content.",
          },
          width: {
            type: "number",
            description:
              "Image width in pixels. Default 1024. Use 1024x1024 for square, 1024x1200 for portrait.",
          },
          height: {
            type: "number",
            description: "Image height in pixels. Default 1024.",
          },
          productType: {
            type: "string",
            description:
              "Type of product (e.g. 'pricing template', 'social media template', 'logo').",
          },
          business: {
            type: "string",
            description:
              "Which business this is for: blirt, printbooth, saudade, or fernhollow (for Wren's own products).",
          },
        },
        required: ["prompt", "productType"],
      },
    } as Anthropic.Tool,
  ];

  const response = await client.messages.create({
    model,
    max_tokens: input.maxTokens ?? 1024,
    system: input.system,
    messages: input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools,
  });

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUseBlock || !input.onToolUse) {
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");
    return text || "I'm not sure what to say here.";
  }

  const toolResult = await input.onToolUse(
    toolUseBlock.name,
    toolUseBlock.input as Record<string, unknown>,
  );

  const preText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  const followUp = await client.messages.create({
    model,
    max_tokens: input.maxTokens ?? 1024,
    system: input.system,
    messages: [
      ...input.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "assistant" as const,
        content: response.content,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "tool_result" as const,
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      },
    ],
    tools,
  });

  const followUpText = followUp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  // Keep real tool output visible so chat UI can render markdown image links.
  return [preText, followUpText, toolResult].filter(Boolean).join("\n\n");
}