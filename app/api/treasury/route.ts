import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import {
  currentMonthString,
  insertTreasuryEntry,
  listTreasuryForMonth,
  summarizeTreasury,
} from "@/lib/treasury";
import { getErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const month =
    url.searchParams.get("month")?.trim() || currentMonthString();

  try {
    const entries = await listTreasuryForMonth(month);
    const totals = summarizeTreasury(entries);
    return NextResponse.json({ month, entries, totals });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type === "income" || body.type === "expense" ? body.type : null;
  const category = typeof body.category === "string" ? body.category.trim() : "";
  let amount_cents = NaN;
  if (typeof body.amount_cents === "number") {
    amount_cents = Math.round(body.amount_cents);
  } else if (typeof body.amount_dollars === "number") {
    amount_cents = Math.round(body.amount_dollars * 100);
  } else if (typeof body.amount_dollars === "string") {
    const n = Number.parseFloat(body.amount_dollars);
    if (!Number.isNaN(n)) amount_cents = Math.round(n * 100);
  }
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const month =
    typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
      ? body.month
      : currentMonthString();
  const business =
    typeof body.business === "string" ? body.business.trim() : null;

  if (
    !type ||
    !category ||
    !description ||
    !Number.isFinite(amount_cents) ||
    amount_cents <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "Need type (income|expense), category, description, and a positive amount (amount_dollars like 12.50 or amount_cents).",
      },
      { status: 400 },
    );
  }

  try {
    const { id } = await insertTreasuryEntry({
      type,
      category,
      amount_cents: Math.abs(amount_cents),
      description,
      business: business || null,
      month,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}
