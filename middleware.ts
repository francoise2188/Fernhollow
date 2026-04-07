import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Keep in sync with lib/auth-constants.ts — inlined so Edge middleware has no extra imports. */
const FERNHOLLOW_AUTH_COOKIE = "fernhollow_auth";
const FERNHOLLOW_AUTH_VALUE = "1";

/**
 * Old bundles request these `.mp3` paths; real files are `.wav` / `.m4a` (see lib/assets.ts).
 * The default matcher skips `.mp3`, so we list these paths explicitly below.
 */
const LEGACY_AUDIO_MP3_TO_FILE: Record<string, string> = {
  "/assets/fernhollow/audio/forest-ambience.mp3":
    "/assets/fernhollow/audio/forest-ambience.wav",
  "/assets/fernhollow/audio/birdsong.mp3":
    "/assets/fernhollow/audio/birdsong.wav",
  "/assets/fernhollow/audio/river.mp3":
    "/assets/fernhollow/audio/river.wav",
  "/assets/fernhollow/audio/fireplace.mp3":
    "/assets/fernhollow/audio/fireplace.m4a",
};

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/assets/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname === "/waitlist") return true;
  if (pathname.startsWith("/products")) return true;
  if (pathname === "/api/auth") return true;
  if (pathname === "/api/webhooks/payhip") return true;
  if (pathname === "/api/waitlist") return true;
  if (pathname.startsWith("/api/r/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyDest = LEGACY_AUDIO_MP3_TO_FILE[pathname];
  if (legacyDest) {
    return NextResponse.rewrite(new URL(legacyDest, request.url));
  }

  const isAuthed =
    request.cookies.get(FERNHOLLOW_AUTH_COOKIE)?.value ===
    FERNHOLLOW_AUTH_VALUE;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuthed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // These must be listed explicitly: the catch‑all below skips `.mp3`, so legacy URLs never hit middleware otherwise.
    "/assets/fernhollow/audio/forest-ambience.mp3",
    "/assets/fernhollow/audio/birdsong.mp3",
    "/assets/fernhollow/audio/river.mp3",
    "/assets/fernhollow/audio/fireplace.mp3",
    // Skip middleware for most `public/` assets; see note above for mp3.
    "/((?!assets|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
};
