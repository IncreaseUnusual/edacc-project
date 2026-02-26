"use client";

import { useEffect, useState } from "react";

export function StreakCounter({ streak }: { streak: number }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (streak >= 2) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(t);
    }
  }, [streak]);

  if (streak < 2) return null;

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-orange-100/80 border border-orange-200/60 px-3 py-1 text-sm font-bold text-orange-600 transition-transform ${
        animate ? "scale-125" : "scale-100"
      }`}
    >
      <span className="text-base font-bold">x</span>
      <span>{streak} in a row!</span>
    </div>
  );
}
