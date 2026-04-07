"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Gate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "That did not work. Try again.",
        );
        return;
      }
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

        .gate-wrap {
          font-family: 'Nunito', sans-serif;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background-color: #1a2e1a;
          background-image:
            radial-gradient(ellipse at 20% 20%, rgba(134,179,107,0.13) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(212,163,115,0.10) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2386b36b' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          position: relative;
          overflow: hidden;
        }

        .gate-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 15% 85%, rgba(134,179,107,0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 15%, rgba(180,140,100,0.06) 0%, transparent 40%);
          pointer-events: none;
        }

        .gate-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: rgba(240, 235, 220, 0.97);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          box-shadow:
            0 0 0 3px rgba(139,109,56,0.4),
            0 0 0 6px rgba(139,109,56,0.15),
            0 20px 60px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.6);
          overflow: hidden;
        }

        .gate-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          border-radius: 24px;
          pointer-events: none;
          opacity: 0.5;
        }

        .gate-deco-top {
          text-align: center;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .gate-mushrooms {
          font-size: 1.6rem;
          letter-spacing: 0.3rem;
          margin-bottom: 0.5rem;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }

        .gate-divider {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }

        .gate-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(139,109,56,0.4), transparent);
        }

        .gate-divider-leaf {
          font-size: 0.7rem;
          color: rgba(139,109,56,0.6);
        }

        .gate-eyebrow {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #7a5c2e;
          margin-bottom: 0.4rem;
        }

        .gate-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #2d4a1e;
          margin: 0 0 0.5rem;
          line-height: 1.2;
        }

        .gate-subtitle {
          font-size: 0.85rem;
          color: #6b7c5a;
          line-height: 1.6;
          margin: 0;
        }

        .gate-form {
          margin-top: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .gate-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          border: 2px solid rgba(139,109,56,0.3);
          background: rgba(255,255,255,0.7);
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          color: #2d4a1e;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .gate-input::placeholder {
          color: #a09070;
        }

        .gate-input:focus {
          border-color: rgba(86,130,60,0.7);
          box-shadow: 0 0 0 3px rgba(86,130,60,0.15);
        }

        .gate-error {
          font-size: 0.82rem;
          color: #c0392b;
          background: rgba(192,57,43,0.08);
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(192,57,43,0.2);
        }

        .gate-btn {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #56823c, #3d6b28);
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #f0ead8;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 12px rgba(61,107,40,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          letter-spacing: 0.02em;
        }

        .gate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(61,107,40,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .gate-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .gate-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .gate-footer-deco {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: #8a7a5a;
          letter-spacing: 0.05em;
        }
      `}</style>

      <div className="gate-wrap">
        <div className="gate-card">
          <div className="gate-deco-top">
            <span className="gate-mushrooms">🍄🌿🌸</span>
            <p className="gate-eyebrow">Fernhollow</p>
            <h1 className="gate-title">The Mossy Gate</h1>
            <div className="gate-divider">
              <span className="gate-divider-line" />
              <span className="gate-divider-leaf">✦</span>
              <span className="gate-divider-line" />
            </div>
            <p className="gate-subtitle">
              This village is private. Whisper the gate password to find your way home.
            </p>
          </div>

          <form onSubmit={onSubmit} className="gate-form">
            <label htmlFor="gate-password" className="sr-only">Gate password</label>
            <input
              id="gate-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="✦ gate password ✦"
              className="gate-input"
            />
            {error && (
              <p className="gate-error" role="alert">🍂 {error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="gate-btn"
            >
              {loading ? "Opening the gate…" : "🌿 Enter the village"}
            </button>
          </form>

          <p className="gate-footer-deco">🍄 · 🌸 · 🍃 · 🌼 · 🍄</p>
        </div>
      </div>
    </>
  );
}
