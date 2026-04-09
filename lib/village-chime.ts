import { buildAgentSystemPrompt, getBaseSystemPrompt } from "@/lib/agents";
import { completeConversation, type ChatTurn } from "@/lib/anthropic";
import { getFrankieGlobalPromptBlock } from "@/lib/frankie-preferences";
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
  const frankieBlock = await getFrankieGlobalPromptBlock();
  const villageMemory = formatMemoriesForPrompt(memories);
  const memoryBlock = [frankieBlock, villageMemory].filter(Boolean).join("\n\n");

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

You are in village square after Clover, Rosie, and Scout. Frankie's message is below. Your angle is income and opportunity: you can talk about ventures beyond Frankie's three businesses (Etsy, Fiverr, templates, affiliates, your own ideas). One short paragraph (2-5 sentences). No bullet points. Be excited but honest. If something would need Frankie's approval before going live (publish, spend money, use her name or brands, price, new accounts, partnerships), say you are flagging that for her. If this is a good moment, nod to your weekly rhythm: what you built, what is earning, what you want to launch next, what needs her OK.

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
