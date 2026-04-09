import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fernhollow_tasks")
    .select("id, agent, task_type, status, run_at, completed_at, output")
    .order("run_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const seen = new Set<string>();
  const latest = (data ?? []).filter((t) => {
    if (seen.has(t.agent)) return false;
    seen.add(t.agent);
    return true;
  });

  const failureSince = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: failedRows } = await supabase
    .from("fernhollow_tasks")
    .select("id, agent, task_type, status, run_at, completed_at, output")
    .eq("status", "failed")
    .gte("completed_at", failureSince)
    .order("completed_at", { ascending: false })
    .limit(12);

  return NextResponse.json({
    tasks: latest,
    recentFailures: failedRows ?? [],
  });
}
