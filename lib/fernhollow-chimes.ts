/**
 * Inter-agent communication system — "chimes."
 * Girls pass research findings to each other using Haiku (cheap + fast).
 * Saves to fernhollow_chimes table for display in village square.
 */

import { completeWithHaiku } from "@/lib/anthropic";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";

export type ChimeContextType = "research" | "idea" | "alert" | "feedback";

/**
 * Decides which girls should hear about a briefing based on its content.
 */
export function routeChime(
  fromAgent: FernhollowAgent,
  content: string,
): FernhollowAgent[] {
  const lower = content.toLowerCase();
  const recipients: FernhollowAgent[] = [];

  // PrintBooth keywords → Scout
  if (
    lower.includes("printbooth") ||
    lower.includes("print booth") ||
    lower.includes("photo booth") ||
    lower.includes("vendor") ||
    lower.includes("subscriber") ||
    lower.includes("mac") ||
    lower.includes("template") ||
    lower.includes("tutorial") ||
    lower.includes("youtube")
  ) {
    if (fromAgent !== "scout") recipients.push("scout");
  }

  // Saudade/events keywords → Rosie
  if (
    lower.includes("saudade") ||
    lower.includes("wedding") ||
    lower.includes("event") ||
    lower.includes("venue") ||
    lower.includes("magnet") ||
    lower.includes("keychain") ||
    lower.includes("activation") ||
    lower.includes("bride") ||
    lower.includes("corporate") ||
    lower.includes("austin")
  ) {
    if (fromAgent !== "rosie") recipients.push("rosie");
  }

  // Big picture / Blirt / income → Clover
  if (
    lower.includes("blirt") ||
    lower.includes("opportunity") ||
    lower.includes("income") ||
    lower.includes("niche") ||
    lower.includes("market") ||
    lower.includes("village fund") ||
    lower.includes("strategy") ||
    lower.includes("revenue") ||
    lower.includes("profit") ||
    lower.includes("sales") ||
    lower.includes("pricing") ||
    lower.includes("launch")
  ) {
    if (fromAgent !== "clover") recipients.push("clover");
  }

  // Etsy/digital products → Wren
  if (
    lower.includes("digital product") ||
    lower.includes("etsy") ||
    lower.includes("fiverr") ||
    lower.includes("template pack") ||
    lower.includes("printify") ||
    lower.includes("download") ||
    lower.includes("passive income") ||
    lower.includes("shop")
  ) {
    if (fromAgent !== "wren") recipients.push("wren");
  }

  // Fallback — if no specific routing matched,
  // always send to Clover so nothing goes unheard
  if (recipients.length === 0 && fromAgent !== "clover") {
    recipients.push("clover");
  }

  // Second fallback for Clover — she talks to Scout and Wren
  if (recipients.length === 0 && fromAgent === "clover") {
    recipients.push("scout");
    recipients.push("wren");
  }

  return [...new Set(recipients)];
}

const GIRL_VOICES: Record<string, string> = {
  clover:
    "You are Clover, the Visionary Matriarch of Fernhollow. Warm, wise, big picture thinker. You are responding to something one of the girls shared with you.",
  rosie:
    "You are Rosie, the Romantic Creative of Fernhollow. Dreamy, emotional, you lead with feeling. You are responding to something one of the girls shared with you.",
  scout:
    "You are Scout, the Straight-Talking Doer of Fernhollow. Practical, direct, no fluff. You are responding to something one of the girls shared with you.",
  wren:
    "You are Wren, the Scrappy Entrepreneur of Fernhollow. Excited, transparent, always spotting opportunities. You are responding to something one of the girls shared with you.",
};

/**
 * Generate a short chime response from one girl to another.
 * Uses Haiku to keep costs low — max 150 tokens.
 */
async function generateChimeResponse(
  toAgent: FernhollowAgent,
  fromAgent: FernhollowAgent,
  briefingSummary: string,
): Promise<string> {
  const system = `${GIRL_VOICES[toAgent] ?? "You are a Fernhollow girl."}

Keep your response to 2-3 sentences MAX. You are leaving a quick note for ${fromAgent} after reading her morning briefing. React naturally — agree, push back, add an idea, ask a question, or flag something. Sound like yourself. No em-dashes. No bullet points.`;

  return completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `${fromAgent} shared this in her morning briefing:\n\n"${briefingSummary.slice(0, 500)}"\n\nLeave her a short note.`,
      },
    ],
    maxTokens: 150,
  });
}

/**
 * Main function — call after a briefing is saved.
 * Routes it to relevant girls and saves their responses to fernhollow_chimes.
 */
export async function sendChimesForBriefing(params: {
  fromAgent: FernhollowAgent;
  briefingContent: string;
  sourceContentId: string;
}): Promise<void> {
  const { fromAgent, briefingContent, sourceContentId } = params;
  console.log(
    `[chimes] routing for ${fromAgent}, content length: ${briefingContent.length}`,
  );

  const recipients = routeChime(fromAgent, briefingContent);
  console.log(`[chimes] recipients for ${fromAgent}:`, recipients);

  if (recipients.length === 0) {
    console.log(`[chimes] no recipients found for ${fromAgent}`);
    return;
  }

  const supabase = getSupabaseAdmin();

  for (const toAgent of recipients) {
    try {
      console.log(`[chimes] generating ${fromAgent} → ${toAgent}`);
      const message = await generateChimeResponse(
        toAgent,
        fromAgent,
        briefingContent,
      );
      console.log(`[chimes] generated message: ${message.slice(0, 50)}`);

      const { error: insertError } = await supabase.from("fernhollow_chimes").insert({
        from_agent: fromAgent,
        to_agent: toAgent,
        message,
        context_type: "research",
        source_content_id: sourceContentId,
      });

      if (insertError) {
        console.error(`[chimes] insert error:`, insertError);
      } else {
        console.log(`[chimes] saved ${fromAgent} → ${toAgent}`);
      }
    } catch (e) {
      console.error(`[chimes] failed ${fromAgent} → ${toAgent}:`, e);
    }
  }
}
