"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Difficulty } from "@/lib/types";
import { passage } from "@/lib/passage";

type Summary = {
  headline: string;
  summary: string;
  encouragement: string;
};

function scoreLabel(pct: number): { text: string; color: string } {
  if (pct >= 80) return { text: "Excellent — you really know your stuff!", color: "text-green-600" };
  if (pct >= 50) return { text: "Solid effort — you're getting there!", color: "text-amber-600" };
  return { text: "Good start — keep at it!", color: "text-blue-600" };
}

function CompletionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const earned = Number(searchParams.get("earned") ?? 0);
  const available = Number(searchParams.get("available") ?? 0);
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "medium";
  const pct = available > 0 ? Math.round((earned / available) * 100) : 0;
  const label = scoreLabel(pct);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [passageOpen, setPassageOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty, earned, available }),
        });

        if (cancelled) return;
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: Summary = await res.json();
        if (!cancelled) setSummary(data);
      } catch (err) {
        console.error("Summary generation failed:", err);
        if (!cancelled) setSummaryError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [difficulty, earned, available]);

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-10 sm:py-16">
      <div className="w-full max-w-2xl space-y-8">
        {/* Score */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-800">
            {summary?.headline ?? "Session Complete!"}
          </h1>

          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-gray-800">
              {earned}
            </span>
            <span className="text-xl text-gray-400">/ {available}</span>
          </div>

          <p className={`text-sm font-semibold ${label.color}`}>
            {pct}% — {label.text}
          </p>

          <p className="text-xs text-gray-400 capitalize">
            Difficulty: {difficulty}
          </p>
        </div>

        {/* AI Summary */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 sm:p-6 space-y-3">
          {!summary && !summaryError && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-500">
                Putting together your learning summary&hellip;
              </p>
            </div>
          )}

          {summaryError && (
            <p className="text-sm text-gray-400 italic">
              Couldn&apos;t generate a summary this time — but great job
              finishing the session!
            </p>
          )}

          {summary && (
            <>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.summary}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {summary.encouragement}
              </p>
            </>
          )}
        </div>

        {/* Full Passage Reveal */}
        <div className="rounded-xl border border-gray-100 bg-white">
          <button
            onClick={() => setPassageOpen((o) => !o)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-gray-700">
              Read the full passage
            </span>
            <span className="text-gray-400 text-xs">
              {passageOpen ? "Hide" : "Show"}
            </span>
          </button>

          {passageOpen && (
            <div className="px-4 pb-4">
              <h2 className="text-base font-bold text-gray-800 mb-2">
                {passage.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {passage.content}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(`/session?difficulty=${difficulty}`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer min-h-[48px]"
          >
            Give it another go ({difficulty})
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer min-h-[48px]"
          >
            Try a different level
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <CompletionContent />
    </Suspense>
  );
}
