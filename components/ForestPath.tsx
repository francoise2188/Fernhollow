import { VillageMap } from "@/components/VillageMap";
import { LogoutButton } from "@/components/LogoutButton";

export function ForestPath() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50/80 dark:from-emerald-950 dark:via-stone-950 dark:to-stone-900">
      <header className="border-b border-stone-200/80 bg-white/70 px-6 py-6 backdrop-blur dark:border-stone-800 dark:bg-stone-950/70">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-800 dark:text-emerald-300">
          Fernhollow
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Welcome home
        </h1>
        <p className="mt-2 max-w-xl text-stone-600 dark:text-stone-400">
          You are on the forest path. Pick a place: a house, the river, the
          garden, or the square.
        </p>
      </header>
      <main className="flex flex-1 flex-col items-center px-6 py-10">
        <VillageMap />
        <div className="mt-10">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
