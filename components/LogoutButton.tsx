"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="text-sm text-stone-500 underline-offset-4 hover:text-stone-700 hover:underline disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
    >
      {loading ? "Leaving…" : "Leave the village (log out)"}
    </button>
  );
}
