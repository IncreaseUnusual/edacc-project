"use client";

import { AnswerResult } from "@/lib/types";

const config: Record<AnswerResult, { bg: string; border: string; label: string }> = {
  correct: {
    bg: "bg-gradient-to-br from-green-50 to-emerald-50/60",
    border: "border-green-300/80",
    label: "Nice work!",
  },
  partial: {
    bg: "bg-gradient-to-br from-amber-50 to-orange-50/60",
    border: "border-amber-300/80",
    label: "You're on the right track!",
  },
  incorrect: {
    bg: "bg-gradient-to-br from-red-50 to-rose-50/60",
    border: "border-red-200/80",
    label: "Not quite — here's what to look for",
  },
};

export function FeedbackCard({
  result,
  feedback,
  pointsEarned,
  pointsAvailable,
  onContinue,
  onRequestAIReview,
  aiReviewLoading,
  onFollowUp,
  continueLabel,
}: {
  result: AnswerResult;
  feedback: string;
  pointsEarned?: number;
  pointsAvailable?: number;
  onContinue: () => void;
  onRequestAIReview?: () => void | Promise<void>;
  aiReviewLoading?: boolean;
  onFollowUp?: () => void;
  continueLabel?: string;
}) {
  const { bg, border, label } = config[result];
  const showPoints =
    pointsEarned !== undefined && pointsAvailable !== undefined && pointsAvailable > 0;

  return (
    <div className={`rounded-3xl border-2 ${border} ${bg} p-5 sm:p-6 card-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold text-gray-800">{label}</span>
        {showPoints && (
          <span className="ml-auto text-sm font-bold text-gray-600">
            {pointsEarned}/{pointsAvailable} pts
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{feedback}</p>
      <div className="flex flex-col gap-2">
        {onFollowUp ? (
          <>
            <button
              onClick={onFollowUp}
              disabled={aiReviewLoading}
              className="w-full rounded-2xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-[0.98] shadow-md shadow-purple-200"
            >
              Try a follow-up question →
            </button>
            <button
              onClick={onContinue}
              disabled={aiReviewLoading}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer py-2 min-h-[44px]"
            >
              Skip &amp; continue
            </button>
          </>
        ) : (
          <button
            onClick={onContinue}
            disabled={aiReviewLoading}
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] active:scale-[0.98] shadow-md shadow-sky-200"
          >
            {continueLabel ?? "Next section →"}
          </button>
        )}
        {onRequestAIReview && (
          <button
            onClick={onRequestAIReview}
            disabled={aiReviewLoading}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-sm font-medium text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {aiReviewLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                Checking with AI&hellip;
              </span>
            ) : (
              "Think I\u2019m right? Ask AI to take another look"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
