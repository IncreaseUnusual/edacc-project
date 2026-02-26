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
    <div className="rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-white to-amber-50/60 p-5 sm:p-6 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-amber-500">
          Section {index + 1} of {total}
        </p>
        <ReadAloudButton text={text} />
      </div>
      <p className="text-base leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}
