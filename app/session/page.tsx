"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Difficulty } from "@/lib/types";
import { getChunks } from "@/lib/passage";

function SessionContent() {
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "medium";
  const chunks = getChunks(difficulty);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <p className="text-sm text-gray-400 mb-2">
          Difficulty: <span className="font-medium text-gray-600">{difficulty}</span>
          {" · "}
          {chunks.length} sections
        </p>
        <p className="text-gray-400">Reading loop — coming in Phase 4</p>
      </div>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading...</div>}>
      <SessionContent />
    </Suspense>
  );
}
