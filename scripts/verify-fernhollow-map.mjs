/**
 * Ensures fernhollow-map2.tmj uses embedded tilesets (image + dimensions in JSON),
 * not external .tsx references — those cannot load in the browser.
 *
 * Run: node scripts/verify-fernhollow-map.mjs
 * Wired into `npm run build` so bad Tiled exports fail CI.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapPath = join(__dirname, "../public/assets/fernhollow/fernhollow-map2.tmj");

const raw = readFileSync(mapPath, "utf8");
const map = JSON.parse(raw);

if (!Array.isArray(map.tilesets)) {
  console.error("[verify-fernhollow-map] Missing tilesets array in", mapPath);
  process.exit(1);
}

let bad = 0;
for (let i = 0; i < map.tilesets.length; i++) {
  const ts = map.tilesets[i];
  const hasSource =
    typeof ts.source === "string" && ts.source.replace(/\s/g, "").length > 0;
  const hasImage =
    typeof ts.image === "string" && ts.image.replace(/\s/g, "").length > 0;

  if (hasSource && !hasImage) {
    console.error(
      "[verify-fernhollow-map] Tileset",
      i,
      "uses external file only — embed in Tiled (Map → Save with embedded tilesets):",
      ts.source,
    );
    bad++;
  }
  if (hasSource && typeof ts.source === "string" && ts.source.includes("Users")) {
    console.error(
      "[verify-fernhollow-map] Tileset source points at a local path — will not work on the web:",
      ts.source,
    );
    bad++;
  }
}

if (bad > 0) {
  console.error(
    "\nWhy: Tiled help sometimes says “embedded” for a different export option. This check looks at the JSON file: each tileset must include an \"image\" field (PNG path). If you only see \"source\": \"…tsx\" and no \"image\", the tileset is still an external reference — Phaser cannot load .tsx in the browser.\n\nFix: Tiled → Map → Save with embedded tilesets (or Tileset → Embed Tileset), save `fernhollow-map2.tmj` into `public/assets/fernhollow/`. Or run (replaces map with a small test village):\n  node scripts/generate-fernhollow-tiled-map.mjs\n",
  );
  process.exit(1);
}

console.log("[verify-fernhollow-map] OK:", mapPath);
