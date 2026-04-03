import type {
  BusinessContext,
  ConversationLocation,
  FernhollowAgent,
} from "@/lib/fernhollow-memory";

export type LocationSlug =
  | "clovers-house"
  | "rosies-cottage"
  | "scouts-workshop"
  | "wrens-house"
  | "river"
  | "garden"
  | "village-square";

export interface LocationMeta {
  slug: LocationSlug;
  title: string;
  shortLabel: string;
  agent: FernhollowAgent;
  location: ConversationLocation;
  business: BusinessContext;
  description: string;
  /** Chat UI: houses, river, village square. Garden is read-only board. */
  hasChat: boolean;
}

export const LOCATIONS: Record<LocationSlug, LocationMeta> = {
  "clovers-house": {
    slug: "clovers-house",
    title: "Clover's House",
    shortLabel: "Clover",
    agent: "clover",
    location: "clovers_house",
    business: "blirt",
    description:
      "The biggest house in Fernhollow. Garden overflowing, wind chimes on the porch. Blirt and the big picture live here.",
    hasChat: true,
  },
  "rosies-cottage": {
    slug: "rosies-cottage",
    title: "Rosie's Cottage",
    shortLabel: "Rosie",
    agent: "rosie",
    location: "rosies_cottage",
    business: "saudade",
    description:
      "Ivy, golden light, fairy lights. Saudade Memory Studio: keepsakes that feel like a hug.",
    hasChat: true,
  },
  "scouts-workshop": {
    slug: "scouts-workshop",
    title: "Scout's Workshop",
    shortLabel: "Scout",
    agent: "scout",
    location: "scouts_workshop",
    business: "printbooth",
    description:
      "Stone walls, herb garden, everything in its place. PrintBooth Pro and straight talk.",
    hasChat: true,
  },
  "wrens-house": {
    slug: "wrens-house",
    title: "Wren's House",
    shortLabel: "Wren",
    agent: "wren",
    location: "wrens_house",
    business: "fernhollow",
    description:
      "Chaotic garden, sticky notes, her own ventures and the village fund. Wren builds income beyond Blirt, Saudade, and PrintBooth.",
    hasChat: true,
  },
  river: {
    slug: "river",
    title: "The River",
    shortLabel: "River",
    agent: "clover",
    location: "river",
    business: null,
    description:
      "Quiet water at the edge of the village. Grounding, no rush. Clover meets you here.",
    hasChat: true,
  },
  garden: {
    slug: "garden",
    title: "Communal Garden",
    shortLabel: "Garden",
    agent: "clover",
    location: "garden",
    business: null,
    description:
      "See what everyone is growing: drafts, approved, and scheduled content across all three businesses.",
    hasChat: false,
  },
  "village-square": {
    slug: "village-square",
    title: "Village Square",
    shortLabel: "Square",
    agent: "clover",
    location: "village_square",
    business: null,
    description:
      "The dashboard: Clover leads; Rosie, Scout, and Wren chime in. Briefings, priorities, income angles, what needs your OK.",
    hasChat: true,
  },
};

export const ALL_LOCATION_SLUGS = Object.keys(LOCATIONS) as LocationSlug[];

export function isLocationSlug(s: string): s is LocationSlug {
  return s in LOCATIONS;
}

/** First URL segment when it is a village location, e.g. /river → river. */
export function pathnameToLocationSlug(pathname: string): LocationSlug | null {
  const seg = pathname.replace(/^\//, "").split("/")[0];
  if (!seg) return null;
  return isLocationSlug(seg) ? seg : null;
}
