"use client";

import { Difficulty } from "@/lib/types";

const options: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", label: "Take it slow", description: "Smaller sections, supportive feedback" },
  { value: "medium", label: "Ready to go", description: "Balanced challenge and guidance" },
  { value: "hard", label: "Challenge me", description: "Longer sections, deeper questions" },
];

export function DifficultyPicker({
  selected,
  onSelect,
}: {
  selected: Difficulty | null;
  onSelect: (d: Difficulty) => void;
}) {
  return (
    <div className="grid gap-3 w-full max-w-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`rounded-xl border-2 px-5 py-4 text-left transition-all ${
            selected === opt.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <span className="block font-semibold text-base">{opt.label}</span>
          <span className="block text-sm text-gray-500 mt-0.5">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}
