import { APIError } from "@anthropic-ai/sdk";
import { getErrorMessage } from "@/lib/errors";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when another attempt may succeed (overload, rate limit, transient 5xx). */
export function isAnthropicRetryableError(e: unknown): boolean {
  if (e instanceof APIError) {
    const s = e.status;
    if (s === 429 || s === 529) return true;
    if (typeof s === "number" && s >= 500) return true;
    const t = e.type;
    if (t === "overloaded_error" || t === "rate_limit_error") return true;
  }
  const msg = getErrorMessage(e).toLowerCase();
  if (msg.includes("overloaded")) return true;
  if (msg.includes("529")) return true;
  if (msg.includes("rate_limit") || msg.includes("429")) return true;
  if (/\b5\d\d\b/.test(msg) && msg.includes("status")) return true;
  return false;
}

export async function withAnthropicRetries<T>(
  run: () => Promise<T>,
  options?: { maxRetries?: number; label?: string },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 5;
  const label = options?.label ?? "anthropic";
  let last: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await run();
    } catch (e) {
      last = e;
      const canRetry = attempt < maxRetries && isAnthropicRetryableError(e);
      if (!canRetry) throw e;
      const backoffMs = Math.min(
        3500 * Math.pow(1.65, attempt) + Math.floor(Math.random() * 1200),
        90_000,
      );
      console.warn(
        `[${label}] retry ${attempt + 1}/${maxRetries} in ${backoffMs}ms:`,
        getErrorMessage(e),
      );
      await sleep(backoffMs);
    }
  }
  throw last;
}
