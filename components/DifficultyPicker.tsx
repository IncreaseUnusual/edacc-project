"use client";

import { Difficulty } from "@/lib/types";

const options: { value: Difficulty; label: string; description: string; accent: string; selectedBg: string; selectedBorder: string; shadow: string }[] = [
  { value: "easy", label: "Take it slow", description: "Smaller sections, supportive feedback", accent: "text-emerald-600", selectedBg: "bg-emerald-50", selectedBorder: "border-emerald-400", shadow: "shadow-emerald-100" },
  { value: "medium", label: "Ready to go", description: "Balanced challenge and guidance", accent: "text-amber-600", selectedBg: "bg-amber-50", selectedBorder: "border-amber-400", shadow: "shadow-amber-100" },
  { value: "hard", label: "Challenge me", description: "Longer sections, deeper questions", accent: "text-rose-600", selectedBg: "bg-rose-50", selectedBorder: "border-rose-400", shadow: "shadow-rose-100" },
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
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`rounded-3xl border-2 px-5 py-4 text-left transition-all active:scale-[0.98] cursor-pointer card-shadow ${
              isSelected
                ? `${opt.selectedBorder} ${opt.selectedBg} shadow-md ${opt.shadow}`
                : "border-gray-200/60 hover:border-gray-300 bg-white/70 backdrop-blur-sm"
            }`}
          >
            <span className={`font-semibold text-base ${isSelected ? opt.accent : "text-gray-700"}`}>{opt.label}</span>
            <span className="block text-sm text-gray-500 mt-0.5">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
