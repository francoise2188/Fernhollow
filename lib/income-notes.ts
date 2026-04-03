import { getBaseSystemPrompt } from "@/lib/agents";
import { completeConversation } from "@/lib/anthropic";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  currentMonthString,
  listTreasuryForMonth,
  summarizeTreasury,
  formatUsd,
} from "@/lib/treasury";

export { currentMonthString };

export function previousMonthString(d = new Date()): string {
  const x = new Date(d);
  x.setMonth(x.getMonth() - 1);
  return x.toISOString().slice(0, 7);
}

/** Shared Wren income note for weekly (manual) or monthly (cron). */
export async function generateWrenIncomeNote(input: {
  month: string;
  mode: "weekly" | "monthly";
}): Promise<{ report: string; contentId: string }> {
  const rows = await listTreasuryForMonth(input.month);
  const totals = summarizeTreasury(rows);
  const label =
    input.mode === "monthly"
      ? `Monthly close for ${input.month}`
      : `Week snapshot for ${input.month}`;

  const summaryLines = [
    label,
    `Income: ${formatUsd(totals.income_cents)}`,
    `Expenses: ${formatUsd(totals.expense_cents)}`,
    `Net: ${formatUsd(totals.net_cents)}`,
    rows.length
      ? `Lines (${rows.length}): ${rows
          .slice(0, 20)
          .map((r) => `${r.type} ${formatUsd(r.amount_cents)} ${r.description}`)
          .join(" | ")}`
      : "No treasury rows for this period.",
  ].join("\n");

  const tone =
    input.mode === "monthly"
      ? "monthly Fernhollow treasury note"
      : "short weekly Fernhollow income note";

  const system = `${getBaseSystemPrompt("wren")}

You are writing a ${tone} for Frankie. Use the numbers below. Warm, clear, transparent about money without being cringe. No em-dashes. Short paragraphs. End with one line about the village fund or the next practical step.`;

  const report = await completeConversation({
    system,
    messages: [
      {
        role: "user",
        content: `Treasury snapshot:\n${summaryLines}\n\nWrite the ${input.mode} note.`,
      },
    ],
    maxTokens: 1000,
  });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_content")
    .insert({
      agent: "wren",
      business: "fernhollow",
      content_type: "email",
      platform: null,
      content: report,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  return { report, contentId: data.id as string };
}
