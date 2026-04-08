/**
 * Image generation for Wren using fal.ai
 * Used to create Etsy product designs, templates, and mockups.
 */

const FAL_API_URL = "https://fal.run/fal-ai/flux/schnell";

export type ImageGenParams = {
  prompt: string;
  width?: number;
  height?: number;
  numImages?: number;
};

export type GeneratedImage = {
  url: string;
  width: number;
  height: number;
};

export async function generateImage(
  params: ImageGenParams,
): Promise<GeneratedImage[]> {
  const key = process.env.FAL_API_KEY?.trim();
  if (!key) throw new Error("Missing FAL_API_KEY");

  const res = await fetch(FAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: params.prompt,
      image_size: {
        width: params.width ?? 1024,
        height: params.height ?? 1024,
      },
      num_images: params.numImages ?? 1,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    images: { url: string; width: number; height: number }[];
  };

  return data.images;
}

/**
 * Generate an Etsy product design based on a brief.
 * Wren calls this when she has an approved design brief.
 */
export async function generateEtsyDesign(params: {
  productType: string;
  style: string;
  colors: string[];
  mood: string[];
  text?: string;
}): Promise<GeneratedImage> {
  const colorList = params.colors.join(", ");
  const moodList = params.mood.join(", ");

  const prompt = [
    "Professional digital product design for Etsy.",
    `Product type: ${params.productType}.`,
    `Style: ${params.style}.`,
    `Color palette: ${colorList}.`,
    `Mood: ${moodList}.`,
    params.text ? `Include text: "${params.text}".` : "",
    "Clean, modern, high quality, print-ready.",
    "White background. No watermarks.",
  ]
    .filter(Boolean)
    .join(" ");

  const images = await generateImage({
    prompt,
    width: 1024,
    height: 1024,
    numImages: 1,
  });

  if (!images[0]) throw new Error("No image generated");
  return images[0];
}

/**
 * Save a generated image URL to fernhollow_content for approval.
 */
export function imageToContentRow(params: {
  agent: string;
  business: string;
  imageUrl: string;
  prompt: string;
  platform: string;
}) {
  return {
    agent: params.agent,
    business: params.business,
    content_type: "image",
    platform: params.platform,
    content: JSON.stringify({
      imageUrl: params.imageUrl,
      prompt: params.prompt,
    }),
    status: "draft",
  };
}
