import { getSupabaseAdmin } from "@/lib/supabase";

export type FeedbackSummary = {
  approved: number;
  dismissed: number;
  notes: string[];
  stopSuggesting: string[];
};

/**
 * Fetch feedback summary for a girl to inject into her morning briefing prompt.
 */
export async function getFeedbackSummaryForAgent(
  agent: string,
): Promise<FeedbackSummary> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fernhollow_feedback")
    .select("*")
    .eq("agent", agent)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { approved: 0, dismissed: 0, notes: [], stopSuggesting: [] };
  }

  const approved = data.filter((r) => r.action === "approved").length;
  const dismissed = data.filter((r) => r.action === "dismissed").length;
  const notes = data
    .filter((r) => r.note && String(r.note).trim())
    .map((r) => `${r.action}: "${r.note}"`)
    .slice(0, 10);
  const stopSuggesting = data
    .filter((r) => r.stop_suggesting)
    .map((r) => (r.note ?? r.content_type) as string)
    .filter(Boolean);

  return { approved, dismissed, notes, stopSuggesting };
}

/**
 * Format feedback summary as a prompt block for the girl.
 */
export function formatFeedbackForPrompt(
  agent: string,
  summary: FeedbackSummary,
): string {
  if (summary.approved === 0 && summary.dismissed === 0) return "";

  const lines = [
    `Frankie's feedback history for ${agent} (use this to improve your briefings):`,
    `Approved ${summary.approved} briefings, dismissed ${summary.dismissed}.`,
  ];

  if (summary.notes.length > 0) {
    lines.push(`Recent feedback notes: ${summary.notes.join(" | ")}`);
  }

  if (summary.stopSuggesting.length > 0) {
    lines.push(
      `Frankie asked you to STOP suggesting: ${summary.stopSuggesting.join(", ")}`,
    );
  }

  lines.push(
    `Adjust your framing and focus based on what Frankie responds to. Don't stop suggesting topics she dismissed — just approach them differently next time.`,
  );

  return lines.join("\n");
}
