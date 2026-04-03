import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  FERNHOLLOW_AUTH_COOKIE,
  FERNHOLLOW_AUTH_VALUE,
} from "./lib/auth-constants";

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
};
