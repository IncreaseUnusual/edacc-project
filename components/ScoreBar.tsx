"use client";

export function ScoreBar({
  earned,
  available,
}: {
  earned: number;
  available: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-amber-100 px-3.5 py-1.5 text-sm card-shadow">
      <span className="text-base font-bold text-amber-500">★</span>
      <span className="text-lg font-bold text-amber-600">
        {earned}
        {available > 0 && (
          <span className="text-gray-400 font-normal text-sm">/{available}</span>
        )}
      </span>
    </div>
  );
}
