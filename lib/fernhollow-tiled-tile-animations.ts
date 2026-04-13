import type { Scene, Tilemaps } from "phaser";

type AnimFrame = { duration: number; tileid: number };

type Tracked = {
  layer: Tilemaps.TilemapLayer;
  tx: number;
  ty: number;
  frames: AnimFrame[];
  tileset: Tilemaps.Tileset;
  frameIdx: number;
  elapsed: number;
};

/**
 * Phaser does not play Tiled “animated tiles” by default. This walks each tile layer, finds tiles
 * with `animation` data from the map JSON, and cycles their global tile index on each update.
 */
export function registerTiledTileAnimations(
  scene: Scene,
  map: Tilemaps.Tilemap,
): () => void {
  const tracked: Tracked[] = [];

  for (const name of map.getTileLayerNames()) {
    const layer = map.getLayer(name)?.tilemapLayer;
    if (!layer) continue;

    layer.forEachTile((tile: Tilemaps.Tile) => {
      if (!tile || tile.index < 1) return;
      const data = tile.getTileData?.() as { animation?: AnimFrame[] } | null;
      const anim = data?.animation;
      if (!anim?.length || !tile.tileset) return;

      const localId = tile.index - tile.tileset.firstgid;
      let frameIdx = anim.findIndex((f) => f.tileid === localId);
      if (frameIdx < 0) frameIdx = 0;

      tracked.push({
        layer,
        tx: tile.x,
        ty: tile.y,
        frames: anim,
        tileset: tile.tileset,
        frameIdx,
        elapsed: 0,
      });
    });
  }

  if (tracked.length === 0) {
    return () => {};
  }

  const onUpdate = (_t: number, delta: number) => {
    for (const tr of tracked) {
      const cur = tr.frames[tr.frameIdx];
      tr.elapsed += delta;
      if (tr.elapsed < cur.duration) continue;
      tr.elapsed = 0;
      tr.frameIdx = (tr.frameIdx + 1) % tr.frames.length;
      const next = tr.frames[tr.frameIdx];
      const newGid = tr.tileset.firstgid + next.tileid;
      tr.layer.putTileAt(newGid, tr.tx, tr.ty, false);
    }
  };

  scene.events.on("update", onUpdate);
  return () => {
    scene.events.off("update", onUpdate);
  };
}
