import { getSupabaseAdmin } from "@/lib/supabase";

/** Rough $/1M tokens — tune via env; defaults are ballpark for planning only. */
function usdPerMillionTokens(model: string): { in: number; out: number } {
  const m = model.toLowerCase();
  if (m.includes("haiku")) {
    return {
      in: parseFloat(process.env.USAGE_HAIKU_INPUT_PER_M ?? "1") || 1,
      out: parseFloat(process.env.USAGE_HAIKU_OUTPUT_PER_M ?? "5") || 5,
    };
  }
  return {
    in: parseFloat(process.env.USAGE_SONNET_INPUT_PER_M ?? "3") || 3,
    out: parseFloat(process.env.USAGE_SONNET_OUTPUT_PER_M ?? "15") || 15,
  };
}

export function estimateAnthropicCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const { in: pi, out: po } = usdPerMillionTokens(model);
  return (inputTokens * pi + outputTokens * po) / 1_000_000;
}

export async function logUsageEvent(input: {
  service: "anthropic" | "fal" | "other";
  operation: string;
  units?: number;
  costUsdEst?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("fernhollow_usage_events").insert({
      service: input.service,
      operation: input.operation,
      units: input.units ?? null,
      cost_usd_est: input.costUsdEst ?? null,
      meta: input.meta ?? null,
    });
  } catch (e) {
    console.warn("[usage-log] insert failed:", e);
  }
}

export async function logAnthropicMessageUsage(input: {
  model: string;
  operation: string;
  usage: { input_tokens?: number; output_tokens?: number } | undefined;
}): Promise<void> {
  const it = input.usage?.input_tokens ?? 0;
  const ot = input.usage?.output_tokens ?? 0;
  if (it === 0 && ot === 0) return;
  const cost = estimateAnthropicCostUsd(input.model, it, ot);
  await logUsageEvent({
    service: "anthropic",
    operation: input.operation,
    units: it + ot,
    costUsdEst: cost,
    meta: { model: input.model, input_tokens: it, output_tokens: ot },
  });
}

export async function logFalImageUsage(input: {
  operation: string;
}): Promise<void> {
  const per =
    parseFloat(process.env.FAL_COST_PER_IMAGE_USD ?? "0.003") || 0.003;
  await logUsageEvent({
    service: "fal",
    operation: input.operation,
    units: 1,
    costUsdEst: per,
  });
}
