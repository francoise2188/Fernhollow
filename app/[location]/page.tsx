import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/ChatWindow";
import { GardenBoard } from "@/components/GardenBoard";
import { LocationShell } from "@/components/LocationShell";
import { TreasuryDashboard } from "@/components/TreasuryDashboard";
import { LogoutButton } from "@/components/LogoutButton";
import {
  ALL_LOCATION_SLUGS,
  isLocationSlug,
  LOCATIONS,
  type LocationSlug,
} from "@/lib/locations";

export function generateStaticParams() {
  return ALL_LOCATION_SLUGS.map((location) => ({ location }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  if (!isLocationSlug(location)) {
    return { title: "Fernhollow" };
  }
  const meta = LOCATIONS[location as LocationSlug];
  return {
    title: `${meta.title} · Fernhollow`,
    description: meta.description,
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  if (!isLocationSlug(location)) {
    notFound();
  }

  const meta = LOCATIONS[location as LocationSlug];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50/80 dark:from-emerald-950 dark:via-stone-950 dark:to-stone-900">
      <header className="border-b border-stone-200/80 bg-white/80 px-6 py-6 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-300"
        >
          ← Back to the forest path
        </Link>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
          Fernhollow
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          {meta.title}
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
          {meta.description}
        </p>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">
        {meta.slug === "garden" ? (
          <GardenBoard />
        ) : meta.slug === "wrens-house" ? (
          <>
            <TreasuryDashboard />
            <ChatWindow slug={meta.slug} />
          </>
        ) : meta.hasChat ? (
          <ChatWindow slug={meta.slug} />
        ) : (
          <LocationShell meta={meta} />
        )}
        <div className="mt-8">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
