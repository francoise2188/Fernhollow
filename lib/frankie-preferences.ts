import type { FernhollowAgent } from "@/lib/fernhollow-memory";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Global preferences for Frankie, stored as shared memories with keys `frankie_*`.
 * Edit in Supabase Table Editor or SQL — no separate UI required for v1.
 */
export async function getFrankieGlobalPromptBlock(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_memory")
    .select("key, value")
    .eq("agent", "shared")
    .like("key", "frankie_%")
    .order("key", { ascending: true });

  if (error || !data?.length) return "";

  const lines = data.map(
    (row) => `- ${String(row.key).replace(/^frankie_/, "")}: ${row.value}`,
  );
  return `Frankie's standing preferences (apply across all conversations unless she contradicts in the moment):\n${lines.join("\n")}`;
}

/**
 * Last two monthly (or fresh-start) recaps for this girl — keys `frankie_recap_YYYY-MM`.
 */
export async function getRecapPromptBlockForAgent(
  agent: FernhollowAgent,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_memory")
    .select("key, value")
    .eq("agent", agent)
    .like("key", "frankie_recap_%")
    .order("key", { ascending: false })
    .limit(2);

  if (error || !data?.length) return "";

  const blocks = data.map((r) => r.value).filter(Boolean);
  if (!blocks.length) return "";

  return `Recent conversation recaps (carry this forward; Frankie may have started a fresh thread):\n${blocks.join("\n\n---\n\n")}`;
}
