import { NextResponse } from "next/server";
import { readAuthFromCookies } from "@/lib/auth";
import { createPricingCalculatorSellable } from "@/lib/sellable-files";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";

export const runtime = "nodejs";

const AGENTS = new Set<string>(["clover", "rosie", "scout", "wren"]);

export async function POST(request: Request) {
  const authed = await readAuthFromCookies();
  if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    agent?: string;
    business?: string;
  };

  const agent = (body.agent && AGENTS.has(body.agent) ? body.agent : "wren") as FernhollowAgent;
  const business =
    typeof body.business === "string" && body.business.trim()
      ? body.business.trim()
      : "fernhollow";

  try {
    const { contentId, fileUrl } = await createPricingCalculatorSellable({
      agent,
      business,
    });
    return NextResponse.json({ ok: true, contentId, fileUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
