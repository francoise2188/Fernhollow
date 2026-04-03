import { getSupabaseAdmin } from "@/lib/supabase";

export type TreasuryType = "income" | "expense";

export type TreasuryCategory =
  | "digital_product"
  | "affiliate"
  | "api_cost"
  | "hosting"
  | "subscription"
  | "fernhollow_sale";

export interface TreasuryRow {
  id: string;
  created_at: string;
  type: TreasuryType;
  category: TreasuryCategory | string;
  amount_cents: number;
  description: string;
  business: string | null;
  month: string;
}

export function currentMonthString(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export function formatUsd(cents: number): string {
  const n = cents / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export async function listTreasuryForMonth(month: string): Promise<TreasuryRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_treasury")
    .select("id, created_at, type, category, amount_cents, description, business, month")
    .eq("month", month)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TreasuryRow[];
}

export function summarizeTreasury(rows: TreasuryRow[]): {
  income_cents: number;
  expense_cents: number;
  net_cents: number;
} {
  let income_cents = 0;
  let expense_cents = 0;
  for (const r of rows) {
    if (r.type === "income") income_cents += r.amount_cents;
    else expense_cents += r.amount_cents;
  }
  return {
    income_cents,
    expense_cents,
    net_cents: income_cents - expense_cents,
  };
}

export async function insertTreasuryEntry(input: {
  type: TreasuryType;
  category: string;
  amount_cents: number;
  description: string;
  business?: string | null;
  month: string;
}): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_treasury")
    .insert({
      type: input.type,
      category: input.category,
      amount_cents: input.amount_cents,
      description: input.description,
      business: input.business ?? null,
      month: input.month,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}
