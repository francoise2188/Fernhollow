import { buildAgentSystemPrompt, getBaseSystemPrompt } from "@/lib/agents";
import { completeConversation, type ChatTurn } from "@/lib/anthropic";
import {
  formatMemoriesForPrompt,
  fetchMemoriesForVillageSquare,
} from "@/lib/fernhollow-memory";

/**
 * Village square: Clover leads, then Rosie, Scout, and Wren chime in (spec 2.1 / Stage 3).
 * Four API calls; one woven reply for the UI and chat log.
 */
export async function composeVillageSquareReply(input: {
  userMessage: string;
  anthropicMessages: ChatTurn[];
}): Promise<string> {
  const memories = await fetchMemoriesForVillageSquare(10);
  const memoryBlock = formatMemoriesForPrompt(memories);

  const cloverSystem = buildAgentSystemPrompt("clover", "village_square");
  const cloverFull = [
    memoryBlock ? `${cloverSystem}\n\n${memoryBlock}` : cloverSystem,
    "For this reply only: stay roughly under 220 words unless Frankie clearly asked for a long answer. Sound like coffee with a friend, not a memo.",
  ].join("\n\n");

  const cloverReply = await completeConversation({
    system: cloverFull,
    messages: input.anthropicMessages,
    maxTokens: 650,
  });

  const rosieSystem = `${getBaseSystemPrompt("rosie")}

You are in village square. Clover already spoke. Frankie's message and Clover's reply are below. Add ONE short paragraph (2-5 sentences) in your voice. Do not repeat Clover. Lead with feeling; one concrete sensory detail if it fits. No bullet points.

Clover said:
${cloverReply}`;

  const rosieChime = await completeConversation({
    system: rosieSystem,
    messages: [
      {
        role: "user",
        content: `Frankie said: ${input.userMessage}`,
      },
    ],
    maxTokens: 320,
  });

  const scoutSystem = `${getBaseSystemPrompt("scout")}

You are in village square. Clover and Rosie already spoke. Frankie's message is below. Add ONE short paragraph (2-5 sentences): practical, concrete, no fluff. If the idea will not work, say why in plain terms.

Clover said:
${cloverReply}

Rosie said:
${rosieChime}`;

  const scoutChime = await completeConversation({
    system: scoutSystem,
    messages: [
      {
        role: "user",
        content: `Frankie said: ${input.userMessage}`,
      },
    ],
    maxTokens: 320,
  });

  const wrenSystem = `${getBaseSystemPrompt("wren")}

You are in village square. Clover, Rosie, and Scout already spoke. Frankie's message is below. Add ONE short paragraph (2-5 sentences) in your voice: income angle, a real opportunity, or one concrete product or pricing idea if it fits. No bullet points. If nothing to monetize, say one honest line about what you are watching for instead.

Clover said:
${cloverReply}

Rosie said:
${rosieChime}

Scout said:
${scoutChime}`;

  const wrenChime = await completeConversation({
    system: wrenSystem,
    messages: [
      {
        role: "user",
        content: `Frankie said: ${input.userMessage}`,
      },
    ],
    maxTokens: 320,
  });

  return [
    `Clover\n${cloverReply}`,
    `Rosie\n${rosieChime}`,
    `Scout\n${scoutChime}`,
    `Wren\n${wrenChime}`,
  ].join("\n\n---\n\n");
}
