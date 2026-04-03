/**
 * One-off helper: regenerates supabase/migrations/003_founder_brief_memory.sql from data/founder-brief.json
 * Run: node scripts/generate-founder-brief-sql.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const { memories } = JSON.parse(
  readFileSync(join(root, "data", "founder-brief.json"), "utf8"),
);

function sqlString(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function sqlBusiness(s) {
  if (s == null || s === "") return "NULL::text";
  return sqlString(s) + "::text";
}

const rows = memories
  .map((m) => {
    const agent = sqlString(m.agent) + "::text";
    const cat = sqlString(m.category) + "::text";
    const key = sqlString(m.key) + "::text";
    const val = sqlString(m.value) + "::text";
    const bus = sqlBusiness(m.business);
    const conf = (m.confidence ?? 1) + "::double precision";
    return `  (${agent}, ${cat}, ${key}, ${val}, ${bus}, ${conf})`;
  })
  .join(",\n");

const sql = `-- ============================================================================
-- PASTE THIS ENTIRE FILE into Supabase SQL Editor and Run.
-- WRONG FILE if line 1 is {  = that is founder-brief.json (JSON). Do not paste JSON.
-- WRONG FILE if line 1 is import = that is seed-founder-brief.mjs (JavaScript).
-- RIGHT FILE: first line is -- (dash dash), then INSERT below.
-- ============================================================================
-- Fernhollow founder brief: seed public.fernhollow_memory.
-- Safe to re-run: only inserts when no row exists with the same agent + key.

INSERT INTO public.fernhollow_memory (agent, category, key, value, business, confidence)
SELECT v.agent, v.category, v.key, v.value, v.business, v.confidence
FROM (
VALUES
${rows}
) AS v(agent, category, key, value, business, confidence)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fernhollow_memory m
  WHERE m.agent = v.agent AND m.key = v.key
);
`;

const out = join(root, "supabase", "migrations", "003_founder_brief_memory.sql");
writeFileSync(out, sql, "utf8");
console.log("Wrote", out);
