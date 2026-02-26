"use client";

import { useState } from "react";
import { Chunk } from "@/lib/types";

export function PreviousChunks({ chunks }: { chunks: Chunk[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (chunks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400">Previous sections</p>
      {chunks.map((chunk) => {
        const isOpen = openIndex === chunk.index;
        return (
          <div
            key={chunk.index}
            className="rounded-2xl border border-amber-100/80 bg-white/50 backdrop-blur-sm overflow-hidden card-shadow"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : chunk.index)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <span>Section {chunk.index + 1}</span>
              <span className="text-gray-400 text-xs">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 text-sm leading-relaxed text-gray-600">
                {chunk.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
