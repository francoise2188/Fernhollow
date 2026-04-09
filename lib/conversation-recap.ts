import { getBaseSystemPrompt } from "@/lib/agents";
import { completeWithHaiku } from "@/lib/anthropic";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";
import { LOCATIONS, type LocationSlug } from "@/lib/locations";
import { getSupabaseAdmin } from "@/lib/supabase";
import { FERNHOLLOW_SESSION_USER_KEY } from "@/lib/session-user";

/** Places with a single chat thread (excludes village square — multi-girl weave). */
export const RECAP_SLUGS: LocationSlug[] = [
  "clovers-house",
  "rosies-cottage",
  "scouts-workshop",
  "wrens-house",
  "river",
];

export function slugToAgent(slug: LocationSlug): FernhollowAgent | null {
  const m = LOCATIONS[slug];
  if (!m?.hasChat || slug === "village-square") return null;
  return m.agent;
}

function recapMemoryKey(month: string): string {
  return `frankie_recap_${month}`;
}

/**
 * Summarize conversation for a stable session and save as `frankie_recap_<month>` memory.
 * @param month YYYY-MM — used in memory key and, when `filterByMonth` is true, filters messages.
 * @param filterByMonth — when true (monthly cron), only messages in that calendar month.
 */
export async function recapConversationForSlug(input: {
  userKey: string;
  slug: LocationSlug;
  month: string;
  filterByMonth: boolean;
}): Promise<{ ok: true; skipped?: string; recap?: string } | { ok: false; error: string }> {
  const agent = slugToAgent(input.slug);
  if (!agent) {
    return { ok: true, skipped: "no agent for slug" };
  }

  const supabase = getSupabaseAdmin();

  const { data: sessionRow, error: sessionErr } = await supabase
    .from("fernhollow_sessions")
    .select("session_id")
    .eq("user_key", input.userKey)
    .eq("slug", input.slug)
    .maybeSingle();

  if (sessionErr) {
    return { ok: false, error: sessionErr.message };
  }
  if (!sessionRow?.session_id) {
    return { ok: true, skipped: "no session" };
  }

  const start = `${input.month}-01T00:00:00.000Z`;
  const endDate = new Date(`${input.month}-01T12:00:00.000Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  const end = endDate.toISOString();

  let query = supabase
    .from("fernhollow_conversations")
    .select("role, content, created_at")
    .eq("session_id", sessionRow.session_id)
    .order("created_at", { ascending: true });

  if (input.filterByMonth) {
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data: messages, error: msgErr } = await query.limit(
    input.filterByMonth ? 500 : 200,
  );

  if (msgErr) {
    return { ok: false, error: msgErr.message };
  }
  if (!messages || messages.length < 4) {
    return { ok: true, skipped: "not enough messages" };
  }

  const convoText = messages
    .map((m) => {
      const label = m.role === "user" ? "Frankie" : agent;
      const body = String(m.content ?? "").slice(0, 400);
      return `${label}: ${body}`;
    })
    .join("\n");

  const system = `${getBaseSystemPrompt(agent)}

You are writing a personal memory recap of your recent conversations with Frankie. Write 2-3 short paragraphs summarizing: what you worked on together, what Frankie cares about, any decisions made, and anything important to remember for future conversations. Write in first person as yourself. Warm and specific. No em-dashes. No bullet points.`;

  const recap = await completeWithHaiku({
    system,
    messages: [
      {
        role: "user",
        content: `Here are our conversations. Write a recap to remember:\n\n${convoText.slice(0, 12_000)}`,
      },
    ],
    maxTokens: 500,
  });

  const key = recapMemoryKey(input.month);

  await supabase
    .from("fernhollow_memory")
    .delete()
    .eq("agent", agent)
    .eq("key", key);

  const { error: insErr } = await supabase.from("fernhollow_memory").insert({
    agent,
    category: "recap",
    key,
    value: recap,
    business: null,
    confidence: 1,
  });

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  return { ok: true, recap };
}

/** Run on the 1st of the month (cron): recap previous calendar month for each house. */
export async function runMonthlyRecapsForAllHouses(input: {
  userKey?: string;
  month: string;
}): Promise<{ slug: LocationSlug; result: string }[]> {
  const userKey = input.userKey ?? FERNHOLLOW_SESSION_USER_KEY;
  const results: { slug: LocationSlug; result: string }[] = [];

  for (const slug of RECAP_SLUGS) {
    const r = await recapConversationForSlug({
      userKey,
      slug,
      month: input.month,
      filterByMonth: true,
    });
    if (!r.ok) {
      results.push({ slug, result: `error: ${r.error}` });
    } else if (r.skipped) {
      results.push({ slug, result: `skipped: ${r.skipped}` });
    } else {
      results.push({ slug, result: "ok" });
    }
  }

  return results;
}
