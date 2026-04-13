/** Pull a readable message from thrown values (Error, Supabase, etc.). */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error_description === "string") return o.error_description;
  }
  return String(e);
}

/**
 * Short text for fernhollow_tasks / activity UI — avoids huge JSON blobs and
 * explains common transient Claude issues.
 */
export function formatAutomationFailureMessage(e: unknown): string {
  const raw = typeof e === "string" ? e : getErrorMessage(e);
  const lower = raw.toLowerCase();
  if (
    lower.includes("overloaded") ||
    lower.includes("529") ||
    lower.includes("rate_limit") ||
    /\b429\b/.test(lower)
  ) {
    return "Claude was temporarily overloaded or rate-limited. Run the job again in a few minutes.";
  }
  if (raw.length > 420) return `${raw.slice(0, 420)}…`;
  return raw;
}
