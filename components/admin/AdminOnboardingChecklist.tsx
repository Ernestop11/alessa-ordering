"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  completed: boolean;
  docsUrl?: string | null;
}

interface ChecklistResponse {
  tenantName: string;
  completedCount: number;
  totalCount: number;
  items: ChecklistItem[];
}

export default function AdminOnboardingChecklist() {
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/onboarding", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const payload: ChecklistResponse = await res.json();
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("We couldn't load your onboarding checklist. Please refresh the page.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = useMemo(() => {
    if (!data) return 0;
    if (data.totalCount === 0) return 100;
    return Math.round((data.completedCount / data.totalCount) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading onboarding checklist…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (!data || data.totalCount === 0 || data.completedCount === data.totalCount) {
    return (
      <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-emerald-800">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">Onboarding Complete</p>
            <p className="text-sm">Everything is connected—you&rsquo;re ready to take orders!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-500/10">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Set up your restaurant</h2>
          <p className="text-sm text-gray-600">
            Complete these steps so your customers can order and receive updates seamlessly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-blue-700">
            {data.completedCount} / {data.totalCount} complete
          </div>
          <div className="relative h-2 w-32 overflow-hidden rounded-full bg-blue-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {data.items.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 shadow-sm transition ${
              item.completed
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                  item.completed ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-600"
                }`}
              >
                {item.completed ? "✓" : "!"}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-gray-600">{item.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={item.actionHref}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  item.completed
                    ? "border border-emerald-200 text-emerald-700 hover:border-emerald-300"
                    : "border border-blue-200 text-blue-700 hover:border-blue-300"
                }`}
              >
                {item.actionLabel}
                <span aria-hidden>→</span>
              </Link>
              {!item.completed && item.docsUrl && (
                <a
                  href={item.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
                >
                  Docs
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

