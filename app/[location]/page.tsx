import { notFound, redirect } from "next/navigation";
import { isLocationSlug } from "@/lib/locations";

/**
 * Legacy /[location] URLs redirect into the single game world with ?chat=.
 */
export default async function LegacyLocationRedirect({
  params,
}: {
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  if (!isLocationSlug(location)) {
    notFound();
  }
  redirect(`/?chat=${encodeURIComponent(location)}`);
}
