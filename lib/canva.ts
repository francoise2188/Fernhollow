/**
 * Canva design brief generator for Wren.
 * Generates structured briefs that can be approved in the village square
 * and opened as pre-filled Canva template searches.
 */

export type CanvaDesignBrief = {
  title: string;
  business: string;
  productType: string;
  dimensions: string;
  canvaFormat: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fonts: string[];
  mood: string[];
  copyElements: {
    headline?: string;
    subheadline?: string;
    bodyText?: string;
    callToAction?: string;
    additionalText?: string[];
  };
  designNotes: string;
  templateSearchQuery: string;
  estimatedPrice?: string;
  platform: string;
};

export type BusinessKey = "blirt" | "printbooth" | "saudade" | "wren";

export const BRAND_KITS: Record<
  BusinessKey,
  {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fonts: string[];
    mood: string[];
  }
> = {
  blirt: {
    primaryColor: "#B5CC2E",
    secondaryColor: "#FAF8F4",
    accentColor: "#1a1a1a",
    fonts: ["Modern sans-serif", "Clean geometric"],
    mood: ["bold", "human", "celebratory", "real", "cheeky"],
  },
  printbooth: {
    primaryColor: "#0E2927",
    secondaryColor: "#E6E6DD",
    accentColor: "#ffffff",
    fonts: ["Anton", "Clean sans-serif"],
    mood: ["professional", "authoritative", "community", "confident", "no-fluff"],
  },
  saudade: {
    primaryColor: "#BFBA45",
    secondaryColor: "#FFF3F0",
    accentColor: "#F95235",
    fonts: ["Fraunces", "Homemade Apple"],
    mood: ["premium", "warm", "emotional", "handcrafted", "intentional"],
  },
  wren: {
    primaryColor: "#4a7a8a",
    secondaryColor: "#f0ead8",
    accentColor: "#56823c",
    fonts: ["Nunito", "Clean modern"],
    mood: ["scrappy", "fresh", "approachable", "modern", "trustworthy"],
  },
};

/**
 * Generate a Canva template search URL based on the brief.
 * Opens Canva with a pre-filled search so the template is mostly ready.
 */
export function generateCanvaSearchUrl(brief: CanvaDesignBrief): string {
  const query = encodeURIComponent(brief.templateSearchQuery);
  return `https://www.canva.com/templates/?query=${query}`;
}

/**
 * Format a design brief as a readable string for the village square.
 */
export function formatBriefForVillageSquare(brief: CanvaDesignBrief): string {
  return `✦ DESIGN BRIEF: ${brief.title}
Business: ${brief.business}
Product: ${brief.productType}
Platform: ${brief.platform}
Dimensions: ${brief.dimensions}
${brief.estimatedPrice ? `Sell price: ${brief.estimatedPrice}` : ""}

BRAND
Colors: ${brief.primaryColor} / ${brief.secondaryColor} / ${brief.accentColor}
Fonts: ${brief.fonts.join(", ")}
Mood: ${brief.mood.join(", ")}

COPY
${brief.copyElements.headline ? `Headline: ${brief.copyElements.headline}` : ""}
${brief.copyElements.subheadline ? `Subheadline: ${brief.copyElements.subheadline}` : ""}
${brief.copyElements.bodyText ? `Body: ${brief.copyElements.bodyText}` : ""}
${brief.copyElements.callToAction ? `CTA: ${brief.copyElements.callToAction}` : ""}
${brief.copyElements.additionalText?.length ? `Additional: ${brief.copyElements.additionalText.join(" | ")}` : ""}

DESIGN NOTES
${brief.designNotes}

CANVA TEMPLATE SEARCH
${generateCanvaSearchUrl(brief)}`;
}

/**
 * Save a design brief to fernhollow_content for village square approval.
 * Call this from an API route — not directly from client.
 */
export function briefToContentRow(brief: CanvaDesignBrief) {
  return {
    agent: "wren",
    business: brief.business,
    content_type: "design_brief",
    platform: brief.platform,
    content: formatBriefForVillageSquare(brief),
    status: "draft" as const,
  };
}
