import { NextResponse } from "next/server";
import { getBaseSystemPrompt } from "@/lib/agents";
import { completeWithHaiku, completeWithSearch } from "@/lib/anthropic";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getErrorMessage } from "@/lib/errors";
import { saveBlogPost } from "@/lib/blog";
import { completeTask, failTask, startTask } from "@/lib/fernhollow-tasks";
import { getSupabaseAdmin } from "@/lib/supabase";

/** Cron: Mondays 13:00 UTC (~8am Central Daylight; ~7am standard). One hour before morning-briefing (14 UTC) so jobs don’t stack. */

export const runtime = "nodejs";

const PRINTBOOTH_SEO_KEYWORDS = [
  "photo booth software for vendors",
  "photo magnet business",
  "how to start a photo booth business",
  "photo keychain business",
  "event vendor software",
  "QR code photo booth",
  "virtual photo booth for events",
  "photo magnet wedding",
  "auto print photo booth",
  "photo booth side hustle",
  "photo magnet maker software",
  "how to make photo magnets at events",
];

function parseBlogJson(raw: string): {
  title: string;
  meta_description: string;
  excerpt: string;
  body: string;
} {
  const clean = raw.replace(/```json\s*|```/gi, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const slice =
    start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
  const parsed = JSON.parse(slice) as Record<string, unknown>;
  const title = String(parsed.title ?? "").trim();
  const meta_description = String(parsed.meta_description ?? "").trim();
  const excerpt = String(parsed.excerpt ?? "").trim();
  const body = String(parsed.body ?? "").trim();
  if (!title || !body) throw new Error("Blog JSON missing title or body");
  return {
    title,
    meta_description,
    excerpt: excerpt || meta_description.slice(0, 200),
    body,
  };
}

export async function GET(request: Request) {
  const gate = verifyCronRequest(request);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? "Forbidden" },
      { status: 401 },
    );
  }

  let taskId: string | null = null;
  const results: string[] = [];

  try {
    const { id } = await startTask({
      agent: "scout",
      taskType: "weekly_content",
      business: "printbooth",
    });
    taskId = id;

    const scoutSystem = getBaseSystemPrompt("scout");
    const supabase = getSupabaseAdmin();

    const shuffled = [...PRINTBOOTH_SEO_KEYWORDS].sort(
      () => Math.random() - 0.5,
    );
    const weekKeywords = shuffled.slice(0, 5);

    for (let i = 0; i < 5; i++) {
      const keyword = weekKeywords[i] ?? weekKeywords[0];
      try {
        const blogRaw = await completeWithSearch({
          system: `${scoutSystem}
You are writing a full SEO-optimized blog post for PrintBooth Pro's blog. This post should rank for the keyword: "${keyword}".
Write a complete, publish-ready blog post. Use natural language, not keyword stuffing.
Include: a compelling H1 title that includes the keyword naturally, a meta description (under 160 characters), an intro paragraph, 3-5 H2 sections with real useful content, a conclusion with a CTA to try PrintBooth Pro.
Frankie's voice: warm, practical, expert but approachable. No em-dashes. No fluff.
Return ONLY valid JSON with keys: title, meta_description, excerpt, body`,
          messages: [
            {
              role: "user",
              content: `Write a complete SEO blog post targeting: "${keyword}". Make it genuinely useful for photo booth vendors and magnet makers. Use your full PrintBooth Pro knowledge. Return only valid JSON.`,
            },
          ],
          maxTokens: 2000,
        });

        const parsed = parseBlogJson(blogRaw);

        const { id: blogId } = await saveBlogPost(
          "printbooth",
          {
            title: parsed.title,
            excerpt: parsed.excerpt,
            body: parsed.body,
            tags: [keyword, "seo", "printbooth-pro"],
          },
          false,
        );

        await supabase.from("fernhollow_content").insert({
          agent: "scout",
          business: "printbooth",
          content_type: "blog_post",
          platform: "printbooth",
          content: JSON.stringify({
            type: "blog_post",
            title: parsed.title,
            excerpt: parsed.excerpt,
            preview: parsed.body.slice(0, 300),
            blogId,
            target: "printbooth",
            keyword,
            meta_description: parsed.meta_description,
            displayText: `📝 SEO BLOG: ${parsed.title}\nKeyword: ${keyword}\n\n${parsed.excerpt}`,
          }),
          status: "draft",
        });

        results.push(`blog:${parsed.title}`);
      } catch (e) {
        console.error(`[weekly-printbooth-content] Blog ${i + 1} failed:`, e);
      }
    }

    for (let i = 0; i < 5; i++) {
      try {
        const post = await completeWithHaiku({
          system: `${scoutSystem}
Write ONE Facebook post for the PrintBooth Pro page.
Target audience: photo booth vendors, magnet makers, event entrepreneurs.
Warm, practical, expert tone. Community-first. End with a question to drive comments.
Under 200 words. No bullet points. No em-dashes. No hashtags in the post body.`,
          messages: [
            {
              role: "user",
              content: `Write Facebook post ${i + 1} of 5 for PrintBooth Pro's page. Mix up the topics: tips, features, vendor wins, how-tos, community questions. Make each one different.`,
            },
          ],
          maxTokens: 300,
        });

        await supabase.from("fernhollow_content").insert({
          agent: "scout",
          business: "printbooth",
          content_type: "fb_post",
          platform: "facebook",
          content: `📣 PRINTBOOTH FB POST ${i + 1} OF 5\n\n${post}`,
          status: "draft",
        });

        results.push(`fb_post:${i + 1}`);
      } catch (e) {
        console.error(`[weekly-printbooth-content] FB post ${i + 1} failed:`, e);
      }
    }

    for (let i = 0; i < 5; i++) {
      try {
        const post = await completeWithHaiku({
          system: `${scoutSystem}
Write ONE Facebook group post for the Photo Magnet Makers Collective — a 6,600+ member community of photo magnet vendors.
This is a COMMUNITY post, not a promotional post for PrintBooth.
Topics: vendor tips, pricing advice, event stories, equipment questions, business wins, community discussions.
Warm, peer-to-peer, community leader tone. Start a genuine conversation. End with a question.
Under 200 words. No bullet points. No em-dashes.`,
          messages: [
            {
              role: "user",
              content: `Write community post ${i + 1} of 5 for the Photo Magnet Makers Collective Facebook group. Mix topics across the 5 posts: pricing, events, equipment, marketing, business building.`,
            },
          ],
          maxTokens: 300,
        });

        await supabase.from("fernhollow_content").insert({
          agent: "scout",
          business: "printbooth",
          content_type: "fb_post",
          platform: "facebook_group",
          content: `👥 MAGNET MAKERS COLLECTIVE POST ${i + 1} OF 5\n\n${post}`,
          status: "draft",
        });

        results.push(`collective_post:${i + 1}`);
      } catch (e) {
        console.error(
          `[weekly-printbooth-content] Collective post ${i + 1} failed:`,
          e,
        );
      }
    }

    for (let i = 0; i < 5; i++) {
      try {
        const idea = await completeWithHaiku({
          system: `${scoutSystem}
Generate ONE detailed video or carousel post idea for PrintBooth Pro's Instagram/TikTok.
Include:
- Format: Video (Reel/TikTok) or Carousel
- Hook (first 3 seconds or first slide)
- Content outline (what to show/say)
- Full caption with Frankie's voice (warm, practical, no em-dashes, don't start with "I")
- 8-10 relevant hashtags researched for reach
- Posting tip (best time, engagement tip)
Be specific and actionable — Frankie should be able to execute this without guessing.`,
          messages: [
            {
              role: "user",
              content: `Create video/carousel idea ${i + 1} of 5 for PrintBooth Pro. Mix formats and topics across the 5: how-tos, behind the scenes, vendor tips, product demos, success stories.`,
            },
          ],
          maxTokens: 400,
        });

        await supabase.from("fernhollow_content").insert({
          agent: "scout",
          business: "printbooth",
          content_type: "video_idea",
          platform: "instagram",
          content: `🎬 VIDEO/CAROUSEL IDEA ${i + 1} OF 5\n\n${idea}`,
          status: "draft",
        });

        results.push(`video_idea:${i + 1}`);
      } catch (e) {
        console.error(
          `[weekly-printbooth-content] Video idea ${i + 1} failed:`,
          e,
        );
      }
    }

    const summary = `Weekly PrintBooth content: ${results.length} pieces. ${results.join(", ")}`;
    await completeTask(taskId, summary);

    return NextResponse.json({
      ok: true,
      count: results.length,
      results,
    });
  } catch (e) {
    const msg = getErrorMessage(e);
    if (taskId) await failTask(taskId, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
