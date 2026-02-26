"use client";

import { useMemo, useState } from "react";
import { DragDropData } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Segment = { type: "text"; value: string } | { type: "blank"; index: number };

function parseSentence(sentence: string): Segment[] {
  const parts = sentence.split(/(__\d+__)/g);
  return parts
    .filter((p) => p !== "")
    .map((p) => {
      const match = p.match(/^__(\d+)__$/);
      if (match) return { type: "blank" as const, index: parseInt(match[1], 10) - 1 };
      return { type: "text" as const, value: p };
    });
}

export function DragDropCard({
  questionText,
  dragDrop,
  onSubmit,
  disabled,
}: {
  questionText: string;
  dragDrop: DragDropData;
  onSubmit: (placements: string[]) => void;
  disabled: boolean;
}) {
  const blankCount = dragDrop.answers.length;
  const [placements, setPlacements] = useState<(string | null)[]>(
    () => Array(blankCount).fill(null),
  );

  const wordBank = useMemo(
    () => shuffle([...dragDrop.answers, ...dragDrop.distractors]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragDrop.sentenceWithBlanks],
  );

  const segments = useMemo(
    () => parseSentence(dragDrop.sentenceWithBlanks),
    [dragDrop.sentenceWithBlanks],
  );

  const usedWords = new Set(placements.filter(Boolean));
  const allFilled = placements.every((p) => p !== null);

  function handleWordTap(word: string) {
    if (disabled) return;
    const firstEmpty = placements.indexOf(null);
    if (firstEmpty === -1) return;
    const next = [...placements];
    next[firstEmpty] = word;
    setPlacements(next);
  }

  function handleBlankTap(index: number) {
    if (disabled) return;
    if (placements[index] === null) return;
    const next = [...placements];
    next[index] = null;
    setPlacements(next);
  }

  function handleSubmit() {
    if (!allFilled || disabled) return;
    onSubmit(placements as string[]);
  }

  return (
    <div className="rounded-3xl border-2 border-violet-200/80 bg-gradient-to-br from-violet-50/70 to-white p-5 sm:p-6 space-y-5 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-violet-600">
          Fill in the blanks
        </p>
      </div>

      <p className="text-sm text-gray-600">{questionText}</p>

      {/* Sentence with blanks */}
      <div className="rounded-2xl bg-white border border-violet-100 p-4 text-base leading-loose text-gray-800">
        {segments.map((seg, i) => {
          if (seg.type === "text") {
            return <span key={i}>{seg.value}</span>;
          }
          const placed = placements[seg.index];
          return (
            <button
              key={i}
              onClick={() => handleBlankTap(seg.index)}
              disabled={disabled}
              className={`inline-flex items-center justify-center mx-1 min-w-[80px] min-h-[36px] rounded-xl border-2 border-dashed px-3 py-1 text-sm font-semibold transition-all cursor-pointer ${
                placed
                  ? "border-violet-400 bg-violet-100 text-violet-700 hover:bg-violet-200"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              } ${disabled ? "cursor-default opacity-60" : ""}`}
              aria-label={placed ? `Remove ${placed}` : `Blank ${seg.index + 1}`}
            >
              {placed ?? `_____`}
            </button>
          );
        })}
      </div>

      {/* Word bank */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400">Tap a word to place it</p>
        <div className="flex flex-wrap gap-2">
          {wordBank.map((word, i) => {
            const isUsed = usedWords.has(word);
            return (
              <button
                key={`${word}-${i}`}
                onClick={() => handleWordTap(word)}
                disabled={disabled || isUsed}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px] ${
                  isUsed
                    ? "bg-gray-100 text-gray-300 cursor-default"
                    : "bg-white border-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400 cursor-pointer active:scale-95 shadow-sm"
                } ${disabled ? "cursor-default" : ""}`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !allFilled}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
          disabled || !allFilled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-violet-500 text-white hover:bg-violet-600 cursor-pointer active:scale-[0.98] shadow-md shadow-violet-200"
        }`}
      >
        Check my answer
      </button>
    </div>
  );
}
