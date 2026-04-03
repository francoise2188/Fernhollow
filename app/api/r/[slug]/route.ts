import { NextResponse } from "next/server";
import { currentMonthString, insertTreasuryEntry } from "@/lib/treasury";
import { getAffiliateUrl } from "@/lib/affiliate-links";

export const runtime = "nodejs";

/**
 * Log an affiliate click (0 dollars) then redirect.
 * Example: /api/r/supabase → your Supabase referral URL.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const dest = getAffiliateUrl(slug);
  if (!dest) {
    return NextResponse.json({ error: "Unknown link" }, { status: 404 });
  }

  try {
    await insertTreasuryEntry({
      type: "income",
      category: "affiliate",
      amount_cents: 0,
      description: `affiliate_click:${slug}`,
      business: "fernhollow",
      month: currentMonthString(),
    });
  } catch {
    /* still redirect */
  }

  return NextResponse.redirect(dest, 302);
}
