"use client";

import { useCallback, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export function QuestionCard({
  questionText,
  onSubmit,
  disabled,
  marks,
}: {
  questionText: string;
  onSubmit: (answer: string) => void;
  disabled: boolean;
  marks?: number;
}) {
  const [answer, setAnswer] = useState("");

  const handleSpeechResult = useCallback((text: string) => {
    setAnswer((prev) => (prev ? prev + " " + text : text));
  }, []);

  const stt = useSpeechRecognition(handleSpeechResult);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || disabled) return;
    if (stt.listening) stt.stop();
    onSubmit(trimmed);
  }

  return (
    <div className="rounded-3xl border-2 border-sky-200/80 bg-gradient-to-br from-sky-50/80 to-white p-5 sm:p-6 card-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-sky-600 flex items-center gap-1.5">
          Question
        </p>
        {marks !== undefined && marks > 0 && (
          <span className="text-xs font-medium text-gray-400">
            {marks} {marks === 1 ? "mark" : "marks"}
          </span>
        )}
      </div>
      <p className="text-base font-semibold text-gray-800 mb-4">
        {questionText}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={
              stt.listening
                ? "Listening… speak now"
                : "Type your answer here…"
            }
            disabled={disabled}
            rows={3}
            className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-50 resize-none ${
              stt.listening
                ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                : "border-gray-200 focus:border-sky-400 focus:ring-sky-400"
            }`}
          />
          {stt.supported && !disabled && (
            <button
              type="button"
              onClick={stt.toggle}
              className={`absolute right-2 bottom-2 rounded-full p-2 text-xs font-medium transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
                stt.listening
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              aria-label={stt.listening ? "Stop listening" : "Voice input"}
              title={stt.listening ? "Stop listening" : "Voice input"}
            >
              {stt.listening ? "Stop" : "Mic"}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !answer.trim()}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
            disabled || !answer.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-sky-500 text-white hover:bg-sky-600 cursor-pointer active:scale-[0.98] shadow-md shadow-sky-200"
          }`}
        >
          Submit answer
        </button>
      </form>
    </div>
  );
}
