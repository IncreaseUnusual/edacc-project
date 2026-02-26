"use client";

import { useMemo, useState } from "react";
import { ReorderData } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function ReorderCard({
  questionText,
  data,
  onSubmit,
  disabled,
}: {
  questionText: string;
  data: ReorderData;
  onSubmit: (order: string[]) => void;
  disabled: boolean;
}) {
  const scrambled = useMemo(
    () => shuffle(data.events),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.events.join("|")],
  );

  const [placed, setPlaced] = useState<(string | null)[]>(
    () => Array(data.events.length).fill(null),
  );
  const [pool, setPool] = useState<string[]>(scrambled);

  function handlePoolTap(item: string) {
    if (disabled) return;
    const firstEmpty = placed.indexOf(null);
    if (firstEmpty === -1) return;
    const next = [...placed];
    next[firstEmpty] = item;
    setPlaced(next);
    setPool(pool.filter((p) => p !== item));
  }

  function handleSlotTap(index: number) {
    if (disabled) return;
    const item = placed[index];
    if (!item) return;
    const next = [...placed];
    next[index] = null;
    setPlaced(next);
    setPool([...pool, item]);
  }

  const allPlaced = placed.every((p) => p !== null);

  return (
    <div className="rounded-3xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white p-5 sm:p-6 space-y-5 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-amber-600">Put these in order!</p>
      </div>

      <p className="text-sm text-gray-600">{questionText}</p>

      {/* Ordered slots */}
      <div className="space-y-2">
        {placed.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSlotTap(i)}
            disabled={disabled}
            className={`w-full text-left rounded-2xl px-4 py-3 text-sm transition-all min-h-[44px] flex items-start gap-3 ${
              item
                ? "bg-amber-100/80 border-2 border-amber-400 text-amber-800 font-medium hover:bg-amber-200 cursor-pointer shadow-sm"
                : "bg-white border-2 border-dashed border-gray-300 text-gray-400 italic"
            } ${disabled ? "cursor-default opacity-60" : ""}`}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-700 font-bold text-xs shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span>{item ?? "Tap an event below"}</span>
          </button>
        ))}
      </div>

      {/* Pool */}
      {pool.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400">
            Tap events in the right order
          </p>
          <div className="space-y-2">
            {pool.map((item) => (
              <button
                key={item}
                onClick={() => handlePoolTap(item)}
                disabled={disabled}
                className="w-full text-left rounded-2xl bg-white border-2 border-amber-200 px-4 py-3 text-sm text-amber-700 font-medium hover:bg-amber-50 hover:border-amber-400 transition-all min-h-[44px] cursor-pointer active:scale-[0.98] shadow-sm"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => allPlaced && onSubmit(placed as string[])}
        disabled={disabled || !allPlaced}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
          disabled || !allPlaced
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer active:scale-[0.98] shadow-md shadow-amber-200"
        }`}
      >
        Lock in my order
      </button>
    </div>
  );
}
