import { Suspense } from "react";
import { FernhollowGameShell } from "@/components/FernhollowGameShell";
import { Gate } from "@/components/Gate";
import { readAuthFromCookies } from "@/lib/auth";

export default async function Home() {
  const authed = await readAuthFromCookies();
  if (!authed) {
    return <Gate />;
  }
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-0 bg-[#0f160f]" aria-hidden />
      }
    >
      <FernhollowGameShell />
    </Suspense>
  );
}
