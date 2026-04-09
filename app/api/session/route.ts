import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { isLocationSlug, LOCATIONS, type LocationSlug } from "@/lib/locations";
import { FERNHOLLOW_SESSION_USER_KEY } from "@/lib/session-user";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug || !isLocationSlug(slug)) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const meta = LOCATIONS[slug as LocationSlug];
  if (!meta.hasChat) {
    return NextResponse.json({ error: "No chat for this place" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const userKey = FERNHOLLOW_SESSION_USER_KEY;

  const { data: existing, error: selErr } = await supabase
    .from("fernhollow_sessions")
    .select("session_id")
    .eq("user_key", userKey)
    .eq("slug", slug)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  if (existing?.session_id) {
    return NextResponse.json({ sessionId: existing.session_id });
  }

  const sessionId = crypto.randomUUID();
  const { error: insErr } = await supabase.from("fernhollow_sessions").insert({
    user_key: userKey,
    slug,
    session_id: sessionId,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId });
}

export async function DELETE(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug || !isLocationSlug(slug)) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const userKey = FERNHOLLOW_SESSION_USER_KEY;

  const { error } = await supabase
    .from("fernhollow_sessions")
    .delete()
    .eq("user_key", userKey)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
