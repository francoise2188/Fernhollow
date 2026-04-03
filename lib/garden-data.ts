import { getSupabaseAdmin } from "@/lib/supabase";

export type GardenRow = {
  id: string;
  created_at: string;
  agent: string;
  business: string;
  content_type: string;
  platform: string | null;
  content: string;
  status: string;
  scheduled_at: string | null;
};

/** Drafts and queued content across all businesses for the communal garden. */
export async function fetchGardenContentRows(): Promise<GardenRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_content")
    .select(
      "id, created_at, agent, business, content_type, platform, content, status, scheduled_at",
    )
    .in("status", ["draft", "approved", "scheduled"])
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;
  return (data ?? []) as GardenRow[];
}
