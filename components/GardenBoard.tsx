import { fetchGardenContentRows } from "@/lib/garden-data";

function statusStyle(status: string): string {
  switch (status) {
    case "scheduled":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
    case "approved":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100";
    default:
      return "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200";
  }
}

export async function GardenBoard() {
  let rows: Awaited<ReturnType<typeof fetchGardenContentRows>> = [];
  let loadError: string | null = null;
  try {
    rows = await fetchGardenContentRows();
  } catch {
    loadError = "Could not load the garden from the database. Check Supabase and that fernhollow_content exists.";
  }

  if (loadError) {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
        {loadError}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/50 px-6 py-10 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="font-medium text-stone-800 dark:text-stone-100">
          The garden is quiet right now.
        </p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          When the girls draft or schedule content, it will show up here: drafts,
          approved, and scheduled posts across Blirt, Saudade, and PrintBooth.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Queued and drafted content">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/80"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            <span
              className={`rounded-full px-2 py-0.5 ${statusStyle(row.status)}`}
            >
              {row.status}
            </span>
            <span>{row.business}</span>
            <span>{row.content_type}</span>
            {row.platform ? <span>{row.platform}</span> : null}
            <span className="normal-case text-stone-400">
              {row.agent}
            </span>
          </div>
          {row.scheduled_at ? (
            <p className="mt-1 text-xs text-stone-500">
              Scheduled:{" "}
              {new Date(row.scheduled_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-800 dark:text-stone-100">
            {row.content.length > 500
              ? `${row.content.slice(0, 500)}…`
              : row.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
