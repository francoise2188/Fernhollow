import { NextResponse } from "next/server";
import { currentMonthString, insertTreasuryEntry } from "@/lib/treasury";
import { parsePayhipPaid } from "@/lib/payhip-webhook";
import { getErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

/** Payhip pings this URL on sale. Add ?token=YOUR_SECRET or X-Fernhollow-Webhook-Token header. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token =
    url.searchParams.get("token")?.trim() ||
    request.headers.get("x-fernhollow-webhook-token")?.trim();
  const expected = process.env.PAYHIP_WEBHOOK_TOKEN?.trim();
  if (expected && token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parsePayhipPaid(body);
  if (!parsed || parsed.amount_cents <= 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await insertTreasuryEntry({
      type: "income",
      category: "digital_product",
      amount_cents: parsed.amount_cents,
      description: parsed.description,
      business: "printbooth",
      month: currentMonthString(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}
