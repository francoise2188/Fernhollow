import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ETSY_CLIENT_ID = process.env.ETSY_API_KEY!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/etsy/callback`;

export async function GET(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=etsy_denied`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("etsy_state")?.value;
  const codeVerifier = cookieStore.get("etsy_code_verifier")?.value;

  if (!state || state !== savedState || !codeVerifier || !code) {
    return NextResponse.redirect(`${baseUrl}/?error=etsy_invalid_state`);
  }

  const tokenRes = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: ETSY_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("Etsy token exchange failed:", text);
    return NextResponse.redirect(`${baseUrl}/?error=etsy_token_failed`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  const shopRes = await fetch("https://openapi.etsy.com/v3/application/users/me", {
    headers: {
      "x-api-key": ETSY_CLIENT_ID,
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  const shopData = shopRes.ok ? ((await shopRes.json()) as Record<string, unknown>) : null;

  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const shopId =
    typeof shopData?.shop_id === "number" || typeof shopData?.shop_id === "string"
      ? String(shopData.shop_id)
      : null;
  const shopName =
    typeof shopData?.shop_name === "string" ? shopData.shop_name : "WrenMakesThings";

  const { error: upsertError } = await supabase.from("fernhollow_integrations").upsert(
    {
      agent: "wren",
      platform: "etsy",
      shop_id: shopId,
      shop_name: shopName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      scopes: ["listings_r", "listings_w", "shops_r", "shops_w", "transactions_r"],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent,platform" },
  );

  if (upsertError) {
    console.error("fernhollow_integrations upsert failed:", upsertError);
    return NextResponse.redirect(`${baseUrl}/?error=etsy_save_failed`);
  }

  const response = NextResponse.redirect(`${baseUrl}/?connected=etsy`);
  response.cookies.set("etsy_code_verifier", "", { path: "/", maxAge: 0 });
  response.cookies.set("etsy_state", "", { path: "/", maxAge: 0 });
  return response;
}
