"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Difficulty } from "@/lib/types";
import { passage } from "@/lib/passage";
import { DifficultyPicker } from "@/components/DifficultyPicker";

export default function WelcomePage() {
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const router = useRouter();

  function handleStart() {
    if (!selected) return;
    router.push(`/session?difficulty=${selected}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {passage.title}
        </h1>

        <div className="mt-10 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Choose your level
          </p>
          <DifficultyPicker selected={selected} onSelect={setSelected} />
        </div>

        <button
          onClick={handleStart}
          disabled={!selected}
          className={`mt-8 w-full max-w-sm rounded-xl px-6 py-3.5 text-base font-semibold transition-all ${
            selected
              ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Let&apos;s begin
        </button>
      </div>
    </main>
  );
}
