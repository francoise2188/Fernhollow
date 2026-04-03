/**
 * Slug → destination URL for /api/r/[slug] (affiliate or referral links).
 * Set any of these in .env.local; missing slugs 404.
 */
export function getAffiliateUrl(slug: string): string | null {
  const map: Record<string, string | undefined> = {
    supabase: process.env.NEXT_PUBLIC_AFFILIATE_SUPABASE_URL,
    vercel: process.env.NEXT_PUBLIC_AFFILIATE_VERCEL_URL,
    payhip: process.env.NEXT_PUBLIC_AFFILIATE_PAYHIP_URL,
  };
  const url = map[slug]?.trim();
  return url && url.length > 0 ? url : null;
}

export const AFFILIATE_SLUGS = ["supabase", "vercel", "payhip"] as const;
