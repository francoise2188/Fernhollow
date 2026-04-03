import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { currentMonthString, generateWrenIncomeNote } from "@/lib/income-notes";

export const runtime = "nodejs";

/** Wren-style weekly income note, saved as draft content for the village. */
export async function POST() {
  const month = currentMonthString();
  try {
    const { report, contentId } = await generateWrenIncomeNote({
      month,
      mode: "weekly",
    });
    return NextResponse.json({ ok: true, contentId, report });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}
