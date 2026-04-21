import { insertMemory, logConversationMessage } from "@/lib/fernhollow-memory";
import { FERNHOLLOW_SESSION_USER_KEY } from "@/lib/session-user";
import { getSupabaseAdmin } from "@/lib/supabase";

const WREN_SLUG = "wrens-house";
const MAX_CHAT_BODY = 12_000;
const MAX_MEMORY_VALUE = 6_000;

/**
 * When Frankie approves Wren's morning briefing (email), copy it into Wren's house chat
 * so her thread "remembers" what she wrote after the inbox row moves to archive.
 * If there is no session yet, store a durable memory row instead.
 */
export async function syncApprovedWrenEmailBriefingToHouseChat(params: {
  content: string;
}): Promise<void> {
  const raw = params.content.trim();
  if (!raw) return;

  const supabase = getSupabaseAdmin();
  const { data: sess, error: sErr } = await supabase
    .from("fernhollow_sessions")
    .select("session_id")
    .eq("user_key", FERNHOLLOW_SESSION_USER_KEY)
    .eq("slug", WREN_SLUG)
    .maybeSingle();

  if (sErr) {
    console.error("[sync-wren-briefing] session lookup:", sErr.message);
  }

  const body =
    "Frankie approved this morning briefing from the village inbox. When she follows up here, continue from what you wrote below.\n\n" +
    "---\n\n" +
    raw.slice(0, MAX_CHAT_BODY);

  if (sess?.session_id) {
    try {
      await logConversationMessage({
        agent: "wren",
        role: "assistant",
        sessionId: sess.session_id,
        location: "wrens_house",
        business: "fernhollow",
        content: body,
      });
      return;
    } catch (e) {
      console.error("[sync-wren-briefing] conversation log failed:", e);
    }
  }

  try {
    await supabase
      .from("fernhollow_memory")
      .delete()
      .eq("agent", "wren")
      .eq("key", "last_approved_morning_briefing");
  } catch {
    /* non-fatal */
  }

  try {
    await insertMemory({
      agent: "wren",
      category: "business",
      key: "last_approved_morning_briefing",
      value: raw.slice(0, MAX_MEMORY_VALUE),
      business: "fernhollow",
      confidence: 0.95,
    });
  } catch (e) {
    console.error("[sync-wren-briefing] memory fallback failed:", e);
  }
}
