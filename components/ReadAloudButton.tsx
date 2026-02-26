"use client";

import { useEffect } from "react";
import { useTextToSpeech, TTSRate } from "@/hooks/useTextToSpeech";

export function ReadAloudButton({ text }: { text: string }) {
  const tts = useTextToSpeech();

  useEffect(() => {
    return () => tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!tts.supported) return null;

  function handlePlayPause() {
    if (tts.loading) return;
    if (!tts.speaking) {
      tts.speak(text);
    } else if (tts.paused) {
      tts.resume();
    } else {
      tts.pause();
    }
  }

  const icon = tts.loading
    ? "..."
    : tts.speaking && !tts.paused
      ? "||"
      : ">";

  const label = tts.loading
    ? "Loading…"
    : tts.speaking && !tts.paused
      ? "Pause"
      : tts.speaking && tts.paused
        ? "Resume"
        : "Read aloud";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlayPause}
        disabled={tts.loading}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={label}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </button>

      {tts.speaking && (
        <div className="flex items-center gap-1">
          {tts.rates.map((r) => (
            <button
              key={r}
              onClick={() => tts.setRate(r as TTSRate)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                tts.rate === r
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      )}

      {tts.speaking && (
        <button
          onClick={tts.stop}
          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          aria-label="Stop"
        >
          Stop
        </button>
      )}
    </div>
  );
}
