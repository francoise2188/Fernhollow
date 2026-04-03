import Link from "next/link";
import { ALL_LOCATION_SLUGS, LOCATIONS } from "@/lib/locations";

export function VillageMap() {
  return (
    <nav
      aria-label="Places in Fernhollow"
      className="grid w-full max-w-2xl gap-3 sm:grid-cols-2"
    >
      {ALL_LOCATION_SLUGS.map((slug) => {
        const place = LOCATIONS[slug];
        return (
          <Link
            key={slug}
            href={`/${slug}`}
            className="group rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/80 dark:hover:border-emerald-600"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {place.shortLabel}
            </p>
            <p className="mt-1 font-semibold text-stone-900 dark:text-stone-50">
              {place.title}
            </p>
            <p className="mt-2 text-sm leading-snug text-stone-600 dark:text-stone-400">
              {place.description}
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-emerald-700 group-hover:underline dark:text-emerald-400">
              Go there
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
