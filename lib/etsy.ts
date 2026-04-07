/**
 * Etsy API v3 helpers — read-only market research for Wren.
 * Requires ETSY_API_KEY in environment.
 */

const ETSY_BASE = "https://openapi.etsy.com/v3";

function getApiKey(): string {
  const key = process.env.ETSY_API_KEY?.trim();
  if (!key) throw new Error("Missing ETSY_API_KEY");
  return key;
}

export type EtsyListing = {
  listing_id: number;
  title: string;
  description: string;
  price: { amount: number; divisor: number; currency_code: string };
  views: number;
  num_favorers: number;
  tags: string[];
  taxonomy_path: string[];
  url: string;
};

export type EtsySearchResult = {
  count: number;
  results: EtsyListing[];
};

/**
 * Search Etsy listings by keyword.
 * Great for trend research — find what's selling in a niche.
 */
export async function searchEtsyListings(params: {
  query: string;
  limit?: number;
  sortOn?: "score" | "listing_creation_date" | "price" | "num_favorers";
  taxonomy?: string;
}): Promise<EtsySearchResult> {
  const key = getApiKey();
  const url = new URL(`${ETSY_BASE}/application/listings/active`);
  url.searchParams.set("keywords", params.query);
  url.searchParams.set("limit", String(params.limit ?? 10));
  url.searchParams.set("sort_on", params.sortOn ?? "score");
  if (params.taxonomy) url.searchParams.set("taxonomy_id", params.taxonomy);

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": key,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Etsy API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<EtsySearchResult>;
}

/**
 * Get trending listings in a category — sorted by favorites.
 * Useful for Wren to spot what's hot right now.
 */
export async function getTrendingInCategory(
  query: string,
  limit = 10,
): Promise<EtsyListing[]> {
  const result = await searchEtsyListings({
    query,
    limit,
    sortOn: "num_favorers",
  });
  return result.results;
}

/**
 * Summarize search results into a briefing-friendly string.
 * Wren can drop this directly into her morning briefing.
 */
export function formatEtsyResearchSummary(
  query: string,
  listings: EtsyListing[],
): string {
  if (listings.length === 0) return `No results found for "${query}" on Etsy.`;

  const lines = listings.slice(0, 5).map((l, i) => {
    const price = (l.price.amount / l.price.divisor).toFixed(2);
    return `${i + 1}. "${l.title}" — $${price} — ${l.num_favorers} favorites`;
  });

  return [
    `Etsy research for "${query}" (top ${lines.length} by favorites):`,
    ...lines,
  ].join("\n");
}
