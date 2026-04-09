import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import {
  recapConversationForSlug,
  slugToAgent,
} from "@/lib/conversation-recap";
import { isLocationSlug, type LocationSlug } from "@/lib/locations";
import { FERNHOLLOW_SESSION_USER_KEY } from "@/lib/session-user";

export const runtime = "nodejs";

/** Manual "fresh start": recap full thread for this month key, no calendar filter on messages. */
export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { slug?: string } | null;
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!slug || !isLocationSlug(slug)) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  if (!slugToAgent(slug as LocationSlug)) {
    return NextResponse.json(
      { error: "Recap is only for a single girl's house or the river." },
      { status: 400 },
    );
  }

  const month = new Date().toISOString().slice(0, 7);

  const result = await recapConversationForSlug({
    userKey: FERNHOLLOW_SESSION_USER_KEY,
    slug: slug as LocationSlug,
    month,
    filterByMonth: false,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    recap: result.recap,
  });
}
