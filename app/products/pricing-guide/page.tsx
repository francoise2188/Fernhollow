import Link from "next/link";

export const metadata = {
  title: "Pricing guide · PrintBooth vendors · Fernhollow",
  description:
    "A practical pricing guide template for PrintBooth vendors. Sold on Payhip.",
};

export default function PricingGuideProductPage() {
  const url = process.env.NEXT_PUBLIC_PAYHIP_PRICING_GUIDE_URL;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50/80 px-6 py-16 dark:from-emerald-950 dark:via-stone-950 dark:to-stone-900">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-300"
        >
          ← Back to the forest path
        </Link>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
          PrintBooth vendors
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Pricing guide template
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          A practical pack to help you price on-site keepsakes with confidence.
          Built for the PrintBooth vendor community.
        </p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-xl bg-emerald-800 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-700"
          >
            Buy on Payhip
          </a>
        ) : (
          <p className="mt-8 text-sm text-stone-500">
            Set{" "}
            <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">
              NEXT_PUBLIC_PAYHIP_PRICING_GUIDE_URL
            </code>{" "}
            in your env to your Payhip product URL.
          </p>
        )}
      </div>
    </div>
  );
}
