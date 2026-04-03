import { getSupabaseAdmin } from "@/lib/supabase";

/** Which girl (or shared). */
export type FernhollowAgent = "clover" | "rosie" | "scout" | "wren" | "shared";

export type MemoryCategory =
  | "voice"
  | "preference"
  | "business"
  | "personal"
  | "pattern";

export type BusinessContext =
  | "blirt"
  | "saudade"
  | "printbooth"
  | "fernhollow"
  | null;

export type ConversationLocation =
  | "clovers_house"
  | "rosies_cottage"
  | "scouts_workshop"
  | "wrens_house"
  | "river"
  | "garden"
  | "village_square";

export type MessageRole = "user" | "assistant";

export type ContentType =
  | "caption"
  | "fb_post"
  | "email"
  | "video_idea"
  | "blog"
  | "product_idea"
  | "template"
  | "pitch";

export type ContentStatus = "draft" | "approved" | "scheduled" | "posted";

export interface FetchMemoriesParams {
  agent: FernhollowAgent;
  business?: BusinessContext;
  /** Prefer this category when ranking (optional). */
  categoryHint?: MemoryCategory;
  limit?: number;
}

/**
 * Fetches candidate memories for this girl and business, then ranks in JS:
 * shared + same business first, then by confidence and recency.
 */
export async function fetchRelevantMemories(
  params: FetchMemoriesParams,
): Promise<
  Array<{
    id: string;
    agent: string;
    category: string;
    key: string;
    value: string;
    business: string | null;
    confidence: number | null;
    updated_at: string;
  }>
> {
  const { agent, business = null, categoryHint, limit = 10 } = params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fernhollow_memory")
    .select("id, agent, category, key, value, business, confidence, updated_at")
    .or(`agent.eq.${agent},agent.eq.shared`)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) throw error;
  const rows = data ?? [];

  const scored = rows
    .map((row) => {
      let score = 0;
      if (row.agent === "shared") score += 2;
      if (business && row.business === business) score += 4;
      if (!business || row.business == null) score += 1;
      if (categoryHint && row.category === categoryHint) score += 2;
      const conf = row.confidence ?? 0;
      const time = new Date(row.updated_at).getTime();
      return { row, score, conf, time };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.conf !== a.conf) return b.conf - a.conf;
      return b.time - a.time;
    })
    .slice(0, limit)
    .map((s) => s.row);

  return scored;
}

export interface UpsertMemoryParams {
  agent: FernhollowAgent;
  category: MemoryCategory;
  key: string;
  value: string;
  business?: BusinessContext;
  confidence?: number;
}

/** Insert a new memory row (spec: tagging by agent, business, category). */
export async function insertMemory(
  params: UpsertMemoryParams,
): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_memory")
    .insert({
      agent: params.agent,
      category: params.category,
      key: params.key,
      value: params.value,
      business: params.business ?? null,
      confidence: params.confidence ?? 0.7,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

/** Format memories for injection into a system prompt. */
export function formatMemoriesForPrompt(
  memories: Awaited<ReturnType<typeof fetchRelevantMemories>>,
): string {
  if (memories.length === 0) return "";
  const lines = memories.map(
    (m) =>
      `- [${m.category}${m.business ? ` · ${m.business}` : ""}] ${m.key}: ${m.value}`,
  );
  return ["What you remember about Frankie and the work:", ...lines].join(
    "\n",
  );
}

/** Log one chat message to fernhollow_conversations. */
export async function logConversationMessage(input: {
  agent: FernhollowAgent;
  role: MessageRole;
  content: string;
  sessionId: string;
  location: ConversationLocation;
  business?: BusinessContext;
}): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_conversations")
    .insert({
      agent: input.agent,
      role: input.role,
      content: input.content,
      session_id: input.sessionId,
      location: input.location,
      business: input.business ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}

/** Load conversation history for a session (newest last). */
export async function loadConversationHistory(
  sessionId: string,
): Promise<
  Array<{
    id: string;
    agent: string;
    role: string;
    content: string;
    location: string;
    business: string | null;
    created_at: string;
  }>
> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_conversations")
    .select("id, agent, role, content, location, business, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Save generated content to fernhollow_content. */
export async function logGeneratedContent(input: {
  agent: FernhollowAgent;
  business: NonNullable<BusinessContext>;
  contentType: ContentType;
  platform?: string | null;
  content: string;
  status?: ContentStatus;
  scheduledAt?: string | null;
}): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("fernhollow_content")
    .insert({
      agent: input.agent,
      business: input.business,
      content_type: input.contentType,
      platform: input.platform ?? null,
      content: input.content,
      status: input.status ?? "draft",
      scheduled_at: input.scheduledAt ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id as string };
}
