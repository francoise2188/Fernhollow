import { logAnthropicMessageUsage } from "@/lib/usage-log";

/**
 * Isolated from lib/anthropic.ts so the main module never dynamic-imports usage-log
 * (avoids odd bundler / chunk ordering issues on Vercel).
 */
export function scheduleAnthropicMessageUsage(input: {
  model: string;
  operation: string;
  usage: { input_tokens?: number; output_tokens?: number } | undefined;
}): void {
  void logAnthropicMessageUsage(input).catch((err) => {
    console.warn("[anthropic-usage-log]", err);
  });
}
