"use client";

import { AnswerResult } from "@/lib/types";

const config: Record<AnswerResult, { bg: string; border: string; icon: string; label: string }> = {
  correct: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "✓",
    label: "Nice work!",
  },
  partial: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "~",
    label: "You're on the right track",
  },
  incorrect: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "✗",
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
  const { bg, border, icon, label } = config[result];
  const showPoints =
    pointsEarned !== undefined && pointsAvailable !== undefined && pointsAvailable > 0;

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold">{icon}</span>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {showPoints && (
          <span className="ml-auto text-sm font-bold text-gray-600">
            {pointsEarned}/{pointsAvailable} pts
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{feedback}</p>
      <div className="flex flex-col gap-2">
        {onFollowUp ? (
          <>
            <button
              onClick={onFollowUp}
              disabled={aiReviewLoading}
              className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
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
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {continueLabel ?? "Next section →"}
          </button>
        )}
        {onRequestAIReview && (
          <button
            onClick={onRequestAIReview}
            disabled={aiReviewLoading}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            {aiReviewLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
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
