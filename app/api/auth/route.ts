import { NextResponse } from "next/server";
import {
  FERNHOLLOW_AUTH_COOKIE,
  FERNHOLLOW_AUTH_VALUE,
} from "@/lib/auth-constants";

/** Trim and strip stray CR (Windows .env line endings) so copy-paste still matches. */
function normalizeGatePassword(s: string): string {
  return s.replace(/\r/g, "").trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const raw =
    typeof body.password === "string" ? body.password : "";
  const password = normalizeGatePassword(raw);
  const expected = normalizeGatePassword(
    process.env.FERNHOLLOW_PASSWORD ?? "",
  );

  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? "FERNHOLLOW_PASSWORD is missing. Add it to fernhollow-web/.env.local and restart npm run dev."
            : "Gate is not configured.",
      },
      { status: 503 },
    );
  }

  if (password !== expected) {
    return NextResponse.json(
      { ok: false, error: "That password does not match." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(FERNHOLLOW_AUTH_COOKIE, FERNHOLLOW_AUTH_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FERNHOLLOW_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
