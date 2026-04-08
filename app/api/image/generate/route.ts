import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { generateEtsyDesign, imageToContentRow } from "@/lib/image-gen";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productType =
    typeof body.productType === "string" ? body.productType.trim() : "";
  const style = typeof body.style === "string" ? body.style.trim() : "";
  const colors = Array.isArray(body.colors)
    ? body.colors.filter((x): x is string => typeof x === "string")
    : [];
  const mood = Array.isArray(body.mood)
    ? body.mood.filter((x): x is string => typeof x === "string")
    : [];
  const text = typeof body.text === "string" ? body.text : undefined;
  const business = typeof body.business === "string" ? body.business : undefined;
  const platform = typeof body.platform === "string" ? body.platform : undefined;

  if (!productType || !style || colors.length === 0 || mood.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const image = await generateEtsyDesign({ productType, style, colors, mood, text });

  const supabase = getSupabaseAdmin();
  const row = imageToContentRow({
    agent: "wren",
    business: business ?? "fernhollow",
    imageUrl: image.url,
    prompt: `${productType} — ${style} — ${colors.join(", ")}`,
    platform: platform ?? "etsy",
  });

  const { data, error } = await supabase
    .from("fernhollow_content")
    .insert(row)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    contentId: data.id,
    imageUrl: image.url,
  });
}
