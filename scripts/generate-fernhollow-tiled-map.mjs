/**
 * Writes public/assets/fernhollow/fernhollow-map.json (Tiled 1.10 orthogonal).
 * Run: node scripts/generate-fernhollow-tiled-map.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "../public/assets/fernhollow/fernhollow-map.json");

const W = 30;
const H = 20;

function isPathCell(c, r) {
  if (c === 15 && r >= 10 && r <= 19) return true;
  if (r === 10 && c >= 8 && c <= 22) return true;
  if (c === 15 && r >= 0 && r <= 9) return true;
  return false;
}

function isWaterCell(c, r) {
  return c >= 0 && c <= 3 && r >= 5 && r <= 12;
}

function hash2(c, r, salt) {
  return ((c * 73856093) ^ (r * 19349663) ^ (salt * 83492791)) >>> 0;
}

/** Row-major, Tiled "right-down" export order */
function flatGrid(fn) {
  const data = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      data.push(fn(c, r));
    }
  }
  return data;
}

// cozy-ground firstgid 1 — grass frame 0 => gid 1, path frame 5 => gid 6
const groundData = flatGrid((c, r) => {
  if (isPathCell(c, r)) {
    if (r === 10 && c >= 8 && c <= 22) {
      return (c + r) % 3 === 0 ? 13 : 6; // accent-ish vs path (frame 12 => gid 13 if exists; else 6)
    }
    return 6;
  }
  return 1;
});

// cozy-water firstgid 1025
const waterData = flatGrid((c, r) => {
  if (!isWaterCell(c, r)) return 0;
  return 1025 + (hash2(c, r, 2) % 8);
});

// cozy-meadow firstgid 1281 — sparse decor (0 = empty)
const decorData = flatGrid((c, r) => {
  if (isPathCell(c, r) || isWaterCell(c, r)) return 0;
  const h = hash2(c, r, 99);
  if (h % 100 > 48) return 0;
  return 1281 + (h % 80);
});

const map = {
  compressionlevel: -1,
  width: W,
  height: H,
  infinite: false,
  layers: [
    {
      data: groundData,
      id: 1,
      name: "Ground",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      height: H,
      x: 0,
      y: 0,
    },
    {
      data: waterData,
      id: 2,
      name: "Water",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      height: H,
      x: 0,
      y: 0,
    },
    {
      data: decorData,
      id: 3,
      name: "Decor",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: W,
      height: H,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 4,
  nextobjectid: 1,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: 16,
  tilewidth: 16,
  type: "map",
  version: "1.10",
  tilesets: [
    {
      columns: 32,
      firstgid: 1,
      image: "Ground Tileset v3.png",
      imageheight: 512,
      imagewidth: 512,
      margin: 0,
      name: "cozy-ground",
      spacing: 0,
      tilecount: 1024,
      tileheight: 16,
      tilewidth: 16,
    },
    {
      columns: 16,
      firstgid: 1025,
      image: "Water grass tileset v2.png",
      imageheight: 256,
      imagewidth: 256,
      margin: 0,
      name: "cozy-water",
      spacing: 0,
      tilecount: 256,
      tileheight: 16,
      tilewidth: 16,
    },
    {
      columns: 32,
      firstgid: 1281,
      image: "Meadow Assets V2.png",
      imageheight: 512,
      imagewidth: 512,
      margin: 0,
      name: "cozy-meadow",
      spacing: 0,
      tilecount: 1024,
      tileheight: 16,
      tilewidth: 16,
    },
  ],
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(map, null, 2), "utf8");
console.log("Wrote", out);
