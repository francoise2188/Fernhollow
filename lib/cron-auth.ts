/**
 * Vercel Cron should call with Authorization: Bearer CRON_SECRET.
 * Set CRON_SECRET in Vercel env and in .env.local for manual tests.
 */
export function verifyCronRequest(request: Request): {
  ok: boolean;
  reason?: string;
} {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return {
        ok: true,
        reason: "CRON_SECRET unset; allowing in development only",
      };
    }
    return { ok: false, reason: "CRON_SECRET not configured" };
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (token !== secret) {
    return { ok: false, reason: "Invalid or missing cron authorization" };
  }
  return { ok: true };
}
