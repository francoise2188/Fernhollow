import Jimp from "jimp";

const input = "public/assets/fernhollow/Super_retro_world_water_animation/Super_retro_world_water_animation/spritesheet_16x16_5frames.png";
const output = "public/assets/fernhollow/water_animation_32x32.png";

const image = await Jimp.read(input);
const newWidth = image.width * 2;
const newHeight = image.height * 2;

image.resize(newWidth, newHeight, Jimp.RESIZE_NEAREST_NEIGHBOR);
await image.writeAsync(output);

console.log(`Done! Saved to ${output}`);
console.log(`New size: ${newWidth}x${newHeight}`);