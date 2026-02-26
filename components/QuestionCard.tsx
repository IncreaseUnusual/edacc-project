"use client";

import { useState } from "react";

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">Question</p>
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
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here…"
          disabled={disabled}
          rows={3}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 resize-none"
        />
        <button
          type="submit"
          disabled={disabled || !answer.trim()}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            disabled || !answer.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          }`}
        >
          Submit answer
        </button>
      </form>
    </div>
  );
}
