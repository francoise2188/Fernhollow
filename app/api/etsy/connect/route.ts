import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

const ETSY_CLIENT_ID = process.env.ETSY_API_KEY!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/etsy/callback`;

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64url");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url");
}

export async function GET() {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ETSY_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "ETSY_API_KEY is not configured." },
      { status: 503 },
    );
  }
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 503 },
    );
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: ETSY_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "listings_r listings_w shops_r shops_w transactions_r",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authUrl = `https://www.etsy.com/oauth/connect?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("etsy_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("etsy_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
