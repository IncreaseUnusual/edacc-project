"use client";

import { useState } from "react";
import { HighlightData } from "@/lib/types";

export function HighlightCard({
  questionText,
  data,
  onSubmit,
  disabled,
}: {
  questionText: string;
  data: HighlightData;
  onSubmit: (selectedIndex: number) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-5 sm:p-6 space-y-5 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-emerald-600">Find the proof!</p>
      </div>

      <p className="text-sm text-gray-600">{questionText}</p>

      <div className="rounded-2xl bg-white border border-emerald-100 p-3 space-y-2">
        <p className="text-xs font-medium text-gray-400 mb-2">
          Tap the sentence that proves it
        </p>
        {data.sentences.map((sentence, i) => (
          <button
            key={i}
            onClick={() => !disabled && setSelected(i)}
            className={`w-full text-left rounded-2xl px-4 py-3 text-sm transition-all min-h-[44px] ${
              selected === i
                ? "bg-emerald-100 border-2 border-emerald-400 text-emerald-800 font-medium shadow-sm"
                : "bg-gray-50/80 border-2 border-transparent text-gray-700 hover:bg-emerald-50 hover:border-emerald-200"
            } ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
            disabled={disabled}
          >
            {sentence}
          </button>
        ))}
      </div>

      <button
        onClick={() => selected !== null && onSubmit(selected)}
        disabled={disabled || selected === null}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
          disabled || selected === null
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer active:scale-[0.98] shadow-md shadow-emerald-200"
        }`}
      >
        That&apos;s my proof! ✓
      </button>
    </div>
  );
}
