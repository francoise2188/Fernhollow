import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("fernhollow_waitlist").insert({
      email,
    });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: 500 },
    );
  }
}
