/**
 * Seeds fernhollow_memory from data/founder-brief.json (idempotent by agent + key).
 *
 * Usage:
 *   npm run seed:founder-brief
 *   npm run seed:founder-brief -- --force   # update rows that already exist
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local).
 * Node 20+ recommended for --env-file in package.json script.
 *
 * For Supabase SQL Editor: do NOT paste this .mjs file. Run the SQL migration
 * supabase/migrations/003_founder_brief_memory.sql instead (or regenerate it with
 * node scripts/generate-founder-brief-sql.mjs after editing data/founder-brief.json).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const force = process.argv.includes("--force");

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\r/g, "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
  .replace(/\r/g, "")
  .trim();

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local and run via npm run seed:founder-brief (uses --env-file).",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const raw = readFileSync(join(root, "data", "founder-brief.json"), "utf8");
const { memories } = JSON.parse(raw);

if (!Array.isArray(memories)) {
  console.error("founder-brief.json must contain a memories array.");
  process.exit(1);
}

let inserted = 0;
let updated = 0;
let skipped = 0;

for (const row of memories) {
  const payload = {
    agent: row.agent,
    category: row.category,
    key: row.key,
    value: row.value,
    business: row.business ?? null,
    confidence: row.confidence ?? 1.0,
  };

  const { data: existing, error: selErr } = await supabase
    .from("fernhollow_memory")
    .select("id")
    .eq("agent", payload.agent)
    .eq("key", payload.key)
    .limit(1);

  if (selErr) {
    console.error(selErr.message);
    process.exit(1);
  }

  const id = existing?.[0]?.id;

  if (id) {
    if (!force) {
      skipped += 1;
      continue;
    }
    const { error: upErr } = await supabase
      .from("fernhollow_memory")
      .update({
        category: payload.category,
        value: payload.value,
        business: payload.business,
        confidence: payload.confidence,
      })
      .eq("id", id);
    if (upErr) {
      console.error(upErr.message);
      process.exit(1);
    }
    updated += 1;
  } else {
    const { error: insErr } = await supabase
      .from("fernhollow_memory")
      .insert(payload);
    if (insErr) {
      console.error(insErr.message);
      process.exit(1);
    }
    inserted += 1;
  }
}

console.log(
  `Done. Inserted ${inserted}, updated ${updated}, skipped ${skipped} (existing; use --force to update).`,
);
