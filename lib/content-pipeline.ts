/**
 * Content pipeline — when Frankie approves a briefing,
 * the relevant girl automatically drafts the full piece of content.
 */
import { completeWithHaiku, completeWithSearch } from "@/lib/anthropic";
import { getBaseSystemPrompt } from "@/lib/agents";
import { getSupabaseAdmin } from "@/lib/supabase";
import { saveBlogPost, type BlogTarget } from "@/lib/blog";
import { createPricingCalculatorSellable } from "@/lib/sellable-files";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";

type ContentRow = {
  id: string;
  agent: string;
  business: string;
  content_type: string;
  content: string;
};

/**
 * Triggered when a briefing is approved.
 * Decides what to draft based on the briefing content and agent.
 */
export async function triggerContentPipeline(
  briefing: ContentRow,
): Promise<void> {
  const lower = briefing.content.toLowerCase();
  const agent = briefing.agent as FernhollowAgent;

  const tasks: Promise<void>[] = [];

  if (
    lower.includes("blog") ||
    lower.includes("tutorial") ||
    lower.includes("guide") ||
    lower.includes("how to") ||
    lower.includes("tips")
  ) {
    const target =
      briefing.business === "blirt"
        ? "blirt"
        : briefing.business === "printbooth"
          ? "printbooth"
          : null;
    if (target) {
      tasks.push(draftBlogPost(agent, briefing.content, target, briefing.id));
    }
  }

  if (
    lower.includes("facebook") ||
    lower.includes("fb group") ||
    lower.includes("community") ||
    lower.includes("post") ||
    lower.includes("engagement")
  ) {
    tasks.push(draftFBPost(agent, briefing.content, briefing.id));
  }

  if (
    lower.includes("instagram") ||
    lower.includes("caption") ||
    lower.includes("reel") ||
    lower.includes("tiktok")
  ) {
    tasks.push(draftCaption(agent, briefing.content, briefing.id));
  }

  if (
    (lower.includes("calculator") && lower.includes("pric")) ||
    lower.includes("pricing calculator")
  ) {
    tasks.push(
      draftPricingSpreadsheet(agent, briefing.business || "fernhollow"),
    );
  }

  if (tasks.length === 0) {
    tasks.push(draftGeneralPost(agent, briefing.content, briefing.id));
  }

  await Promise.allSettled(tasks);
}

async function draftPricingSpreadsheet(
  agent: FernhollowAgent,
  business: string,
): Promise<void> {
  await createPricingCalculatorSellable({ agent, business });
}

async function draftBlogPost(
  agent: FernhollowAgent,
  briefingContent: string,
  target: BlogTarget,
  _sourceId: string,
): Promise<void> {
  const system = `${getBaseSystemPrompt(agent)}
You are drafting a full blog post based on a briefing idea you had. Write a complete, publish-ready blog post. Include a compelling title, a short excerpt (2-3 sentences), and full body content. Format as JSON with keys: title, excerpt, body. No markdown in the JSON values except for the body which can use ## headings and paragraph breaks. No em-dashes.`;

  const raw = await completeWithSearch({
    system,
    messages: [
      {
        role: "user",
        content: `Based on this briefing idea, write a full blog post for ${target}:\n\n"${briefingContent.slice(0, 600)}"\n\nReturn ONLY valid JSON with keys: title, excerpt, body`,
      },
    ],
    maxTokens: 1500,
  });

  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean) as {
    title: string;
    excerpt: string;
    body: string;
  };

  const { id: blogId } = await saveBlogPost(target, parsed, false);

  const supabase = getSupabaseAdmin();
  await supabase.from("fernhollow_content").insert({
    agent,
    business: target === "blirt" ? "blirt" : "printbooth",
    content_type: "blog_post",
    platform: target,
    content: JSON.stringify({
      type: "blog_post",
      title: parsed.title,
      excerpt: parsed.excerpt,
      preview: parsed.body.slice(0, 300),
      blogId,
      target,
      displayText: `📝 BLOG POST DRAFTED\n\nTitle: ${parsed.title}\n\nExcerpt: ${parsed.excerpt}\n\n${parsed.body.slice(0, 300)}...`,
    }),
    status: "draft",
  });
}

async function draftFBPost(
  agent: FernhollowAgent,
  briefingContent: string,
  _sourceId: string,
): Promise<void> {
  const system = `${getBaseSystemPrompt(agent)}
You are drafting a Facebook group post. Write ONE complete, ready-to-post Facebook post. Warm, conversational, community-focused. No bullet points. No em-dashes. End with a question to drive engagement. Under 200 words. Just the post text, nothing else.`;

  const post = await completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `Draft a Facebook group post based on this idea:\n\n"${briefingContent.slice(0, 400)}"`,
      },
    ],
    maxTokens: 300,
  });

  const supabase = getSupabaseAdmin();
  await supabase.from("fernhollow_content").insert({
    agent,
    business:
      agent === "scout"
        ? "printbooth"
        : agent === "rosie"
          ? "saudade"
          : "blirt",
    content_type: "fb_post",
    platform: "facebook",
    content: `📣 FACEBOOK POST READY TO COPY\n\n${post}`,
    status: "draft",
  });
}

async function draftCaption(
  agent: FernhollowAgent,
  briefingContent: string,
  _sourceId: string,
): Promise<void> {
  const system = `${getBaseSystemPrompt(agent)}
You are drafting an Instagram caption. Write ONE complete caption. Warm, real, never salesy. No bullet points. No em-dashes. Don't start with "I". Include 5-8 relevant hashtags at the end. Under 150 words. Just the caption text and hashtags, nothing else.`;

  const caption = await completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `Draft an Instagram caption based on this idea:\n\n"${briefingContent.slice(0, 400)}"`,
      },
    ],
    maxTokens: 250,
  });

  const supabase = getSupabaseAdmin();
  await supabase.from("fernhollow_content").insert({
    agent,
    business:
      agent === "scout"
        ? "printbooth"
        : agent === "rosie"
          ? "saudade"
          : "blirt",
    content_type: "caption",
    platform: "instagram",
    content: `📸 INSTAGRAM CAPTION READY TO COPY\n\n${caption}`,
    status: "draft",
  });
}

async function draftGeneralPost(
  agent: FernhollowAgent,
  briefingContent: string,
  _sourceId: string,
): Promise<void> {
  const system = `${getBaseSystemPrompt(agent)}
You are drafting a short social post. Write ONE complete, ready-to-use post. Warm, real, conversational. Under 150 words. Just the post text, nothing else.`;

  const post = await completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `Draft a social post based on this idea:\n\n"${briefingContent.slice(0, 400)}"`,
      },
    ],
    maxTokens: 250,
  });

  const supabase = getSupabaseAdmin();
  await supabase.from("fernhollow_content").insert({
    agent,
    business: briefingContent.toLowerCase().includes("blirt")
      ? "blirt"
      : briefingContent.toLowerCase().includes("printbooth")
        ? "printbooth"
        : "saudade",
    content_type: "social_post",
    platform: "general",
    content: `✍️ DRAFT READY\n\n${post}`,
    status: "draft",
  });
}
