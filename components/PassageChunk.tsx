"use client";

import { ReadAloudButton } from "@/components/ReadAloudButton";

export function PassageChunk({
  index,
  text,
  total,
}: {
  index: number;
  text: string;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-400">
          Section {index + 1} of {total}
        </p>
        <ReadAloudButton text={text} />
      </div>
      <p className="text-base leading-relaxed text-gray-800">{text}</p>
    </div>
  );
}
