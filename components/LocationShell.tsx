import type { LocationMeta } from "@/lib/locations";

/** Garden and village square: no chat yet, just the mood of the place. */
export function LocationShell({ meta }: { meta: LocationMeta }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-8 text-center dark:border-stone-600 dark:bg-stone-900/50">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Coming in a later stage
      </p>
      <p className="mt-3 text-stone-700 dark:text-stone-300">
        {meta.title} will get its live tools (queues, briefings, income) as we
        build. For now, breathe here and head to a house or the river to talk
        with the girls.
      </p>
    </div>
  );
}
