"use client";

export function ScoreBar({
  earned,
  available,
}: {
  earned: number;
  available: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
      <span className="font-semibold text-gray-700">Score</span>
      <span className="text-lg font-bold text-blue-600">
        {earned}
        {available > 0 && (
          <span className="text-gray-400 font-normal">/{available}</span>
        )}
      </span>
    </div>
  );
}
