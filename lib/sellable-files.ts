import { randomUUID } from "node:crypto";
import { buildPhotoBoothPricingCalculatorBuffer } from "@/lib/sellable-xlsx";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { FernhollowAgent } from "@/lib/fernhollow-memory";

const BUCKET = "sellables";

/**
 * Builds a real .xlsx, uploads to Supabase Storage, inserts a Village Square row.
 */
export async function createPricingCalculatorSellable(input: {
  agent: FernhollowAgent;
  business: string;
}): Promise<{ contentId: string; fileUrl: string }> {
  const buffer = await buildPhotoBoothPricingCalculatorBuffer();
  const contentId = randomUUID();
  const path = `${contentId}/photo-booth-pricing-calculator.xlsx`;

  const supabase = getSupabaseAdmin();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });

  if (upErr) throw new Error(upErr.message);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = pub.publicUrl;

  const payload = {
    type: "spreadsheet",
    fileName: "photo-booth-pricing-calculator.xlsx",
    fileUrl,
    description:
      "Editable Excel pricing sheet with line items, subtotal, tax, and grand total.",
  };

  const { error: insErr } = await supabase.from("fernhollow_content").insert({
    id: contentId,
    agent: input.agent,
    business: input.business,
    content_type: "spreadsheet",
    platform: "download",
    content: JSON.stringify(payload),
    status: "draft",
  });

  if (insErr) throw new Error(insErr.message);

  return { contentId, fileUrl };
}
