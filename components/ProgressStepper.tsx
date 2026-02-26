"use client";

export function ProgressStepper({
  total,
  current,
  completed,
}: {
  total: number;
  current: number;
  completed: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completed;
        const isCurrent = i === current;

        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? "w-6 h-3 bg-sky-400 shadow-sm shadow-sky-200"
                : isDone
                  ? "w-3 h-3 bg-emerald-400"
                  : "w-3 h-3 bg-gray-200/60"
            }`}
          />
        );
      })}
    </div>
  );
}
