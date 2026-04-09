import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_usage_events")
    .select("service, cost_usd_est, units")
    .gte("created_at", since);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalUsd = 0;
  const byService: Record<string, number> = {};
  let events = 0;
  for (const row of data ?? []) {
    events++;
    const c = Number(row.cost_usd_est) || 0;
    totalUsd += c;
    const s = String(row.service);
    byService[s] = (byService[s] ?? 0) + c;
  }

  return NextResponse.json({
    windowDays: 7,
    since,
    events,
    totalUsdEst: Math.round(totalUsd * 10000) / 10000,
    byService,
    note: "Rough estimates for planning; tune USD/M token env vars in usage-log.",
  });
}
