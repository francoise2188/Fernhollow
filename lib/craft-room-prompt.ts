import { completeWithHaiku } from "@/lib/anthropic";

/**
 * Turn stored briefing content into plain text for the craft-room model.
 */
export function flattenBriefingContentForPrompt(
  content: string,
  contentType: string,
): string {
  if (contentType === "spreadsheet") {
    try {
      const j = JSON.parse(content) as {
        fileName?: string;
        fileUrl?: string;
        description?: string;
      };
      return [
        "Type: downloadable spreadsheet (sellable file).",
        j.description ?? "",
        j.fileName ? `File name: ${j.fileName}` : "",
        j.fileUrl ? `Download URL: ${j.fileUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      return content;
    }
  }
  if (contentType === "image") {
    try {
      const j = JSON.parse(content) as { imageUrl?: string; prompt?: string };
      return [
        "Type: generated image / mockup.",
        j.prompt ? `Design prompt: ${j.prompt}` : "",
        j.imageUrl ? `Asset URL (https): ${j.imageUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      return content;
    }
  }
  if (contentType === "blog_post") {
    try {
      const j = JSON.parse(content) as {
        title?: string;
        excerpt?: string;
        preview?: string;
        target?: string;
      };
      return [
        "Type: blog post draft.",
        j.title ? `Title: ${j.title}` : "",
        j.excerpt ? `Excerpt: ${j.excerpt}` : "",
        j.preview ? `Body preview: ${j.preview}` : "",
        j.target ? `Site: ${j.target}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      return content;
    }
  }
  return content;
}

/**
 * One paste-ready block for Claude in Cursor: design / polish a sellable digital product.
 */
export async function generateCraftRoomClipboardPrompt(input: {
  agent: string;
  business: string;
  contentType: string;
  flatContent: string;
}): Promise<string> {
  const system = `You write ONE paste-ready prompt for Claude (used inside Cursor with Frankie). Claude will help her design, refine, or plan a sellable digital product: PDF, printable, spreadsheet idea, Etsy listing visuals, Canva-bound layout notes, or similar.

Rules:
- Output ONLY the prompt text Frankie will paste. No preamble or "Here is".
- Warm, clear, Fernhollow-adjacent wording is OK inside the prompt, but stay practical.
- No em-dashes. No roleplay. No meta commentary.
- Include: goal, target buyer, deliverable format, aesthetic direction, must-haves, what to avoid, and one line on how to iterate in Cursor if relevant.
- If the source is an image mockup, ask Claude how to turn it into a production-ready deliverable or listing.
- Keep under about 500 words.`;

  const flat = input.flatContent.trim();
  const capped = flat.length > 8000 ? `${flat.slice(0, 8000)}\n[truncated]` : flat;

  return completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `Agent: ${input.agent}
Business: ${input.business}
Content type: ${input.contentType}

Source material:
"""
${capped}
"""`,
      },
    ],
    maxTokens: 900,
  });
}
