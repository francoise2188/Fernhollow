import { getSupabaseAdmin } from "@/lib/supabase";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";

export type TaskType =
  | "morning_briefing"
  | "weekly_content"
  | "income_report"
  | "community_scan"
  | "auto_draft";

export async function startTask(input: {
  agent: FernhollowAgent;
  taskType: TaskType;
  business?: string | null;
}): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_tasks")
    .insert({
      agent: input.agent,
      task_type: input.taskType,
      business: input.business ?? null,
      status: "running",
      run_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

export async function completeTask(
  id: string,
  output: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("fernhollow_tasks")
    .update({
      status: "complete",
      output,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function failTask(id: string, output: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("fernhollow_tasks")
    .update({
      status: "failed",
      output,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
