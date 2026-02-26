"use client";

import { useCallback, useState } from "react";
import { FollowUpResponse } from "@/lib/types";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type FollowUpCardProps = {
  loading?: boolean;
  questionText?: string;
  hint?: string;
  chunkText?: string;
  onSubmit?: (answer: string) => void;
  submitting?: boolean;
  result?: FollowUpResponse;
  onContinue?: () => void;
};

export function FollowUpCard({
  loading,
  questionText,
  hint,
  chunkText,
  onSubmit,
  submitting,
  result,
  onContinue,
}: FollowUpCardProps) {
  const [answer, setAnswer] = useState("");

  const handleSpeechResult = useCallback((text: string) => {
    setAnswer((prev) => (prev ? prev + " " + text : text));
  }, []);

  const stt = useSpeechRecognition(handleSpeechResult);

  if (loading) {
    return (
      <div className="rounded-3xl border-2 border-purple-200/80 bg-gradient-to-br from-purple-50/70 to-white p-5 sm:p-6 card-shadow">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          <p className="text-sm text-gray-500">
            Thinking of a follow-up for you&hellip;
          </p>
        </div>
      </div>
    );
  }

  if (!questionText) return null;

  const hasResult = result !== undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || !onSubmit) return;
    if (stt.listening) stt.stop();
    onSubmit(trimmed);
  }

  return (
    <div className="rounded-3xl border-2 border-purple-200/80 bg-gradient-to-br from-purple-50/70 to-white p-5 sm:p-6 space-y-4 card-shadow">
      <p className="text-sm font-semibold text-purple-700 flex items-center gap-1.5">
        Follow-up Question
      </p>

      {chunkText && (
        <div className="rounded-2xl bg-white/60 border border-purple-100 p-3">
          <p className="text-xs text-gray-400 mb-1">Re-read this section:</p>
          <p className="text-sm text-gray-600 leading-relaxed">{chunkText}</p>
        </div>
      )}

      <p className="text-base font-semibold text-gray-800">{questionText}</p>

      {hint && !hasResult && (
        <p className="text-sm text-purple-600 italic">Hint: {hint}</p>
      )}

      {!hasResult && (
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
              disabled={submitting}
              rows={3}
              className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-50 resize-none ${
                stt.listening
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                  : "border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              }`}
            />
            {stt.supported && !submitting && (
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
            disabled={submitting || !answer.trim()}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] ${
              submitting || !answer.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600 cursor-pointer active:scale-[0.98] shadow-md shadow-purple-200"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Checking your answer&hellip;
              </span>
            ) : (
              "Submit follow-up answer"
            )}
          </button>
        </form>
      )}

      {hasResult && (
        <div
          className={`rounded-2xl p-4 ${
            result.result === "correct"
              ? "bg-gradient-to-br from-green-50 to-emerald-50/60 border-2 border-green-200"
              : "bg-gradient-to-br from-red-50 to-rose-50/60 border-2 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {result.result === "correct" ? "✓" : "✗"}
            </span>
            <span className="text-sm font-bold text-gray-800">
              {result.result === "correct" ? "Well done!" : "Not quite — here\u2019s the answer"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-2">{result.feedback}</p>

          {result.result === "incorrect" && result.correctAnswer && (
            <div className="rounded-2xl bg-white/80 p-3 mt-2">
              <p className="text-xs text-gray-400 mb-1">The answer:</p>
              <p className="text-sm text-gray-700 font-medium">
                {result.correctAnswer}
              </p>
            </div>
          )}

          {onContinue && (
            <button
              onClick={onContinue}
              className="mt-3 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors cursor-pointer min-h-[48px] active:scale-[0.98] shadow-md shadow-sky-200"
            >
              Next section →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
