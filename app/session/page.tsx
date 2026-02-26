"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AnswerResult, Chunk, Difficulty, FollowUpResponse, Question } from "@/lib/types";
import { evaluateAnswer, EvaluationResult } from "@/lib/evaluate";
import { getChunks, passage } from "@/lib/passage";
import { ScoreBar } from "@/components/ScoreBar";
import { PassageChunk } from "@/components/PassageChunk";
import { PreviousChunks } from "@/components/PreviousChunks";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FollowUpCard } from "@/components/FollowUpCard";

type Phase = "loading" | "reading" | "answering" | "feedback" | "followup" | "followup-result";

const STORAGE_PREFIX = "edacc-session-";

type Score = { earned: number; available: number };

type PersistedState = {
  questions: Question[];
  progressIndex: number;
  score: Score;
  deepAnalyzeUsed: string[];
  followUpUsed: string[];
};

function loadSession(difficulty: Difficulty): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + difficulty);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.score && "correct" in parsed.score) {
      parsed.score = { earned: parsed.score.correct, available: parsed.score.total };
    }
    return parsed as PersistedState;
  } catch {
    return null;
  }
}

function saveSession(difficulty: Difficulty, state: PersistedState) {
  localStorage.setItem(STORAGE_PREFIX + difficulty, JSON.stringify(state));
}

function clearSession(difficulty: Difficulty) {
  localStorage.removeItem(STORAGE_PREFIX + difficulty);
}

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "medium";
  const chunks = getChunks(difficulty);

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progressIndex, setProgressIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const [score, setScore] = useState<Score>({ earned: 0, available: 0 });
  const [feedbackState, setFeedbackState] = useState<{
    result: AnswerResult;
    feedback: string;
  } | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string>("");
  const [deepAnalyzeUsed, setDeepAnalyzeUsed] = useState<Set<string>>(new Set());
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [followUp, setFollowUp] = useState<{
    questionText: string;
    hint: string;
    expectedAnswer: string;
  } | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpResponse | null>(null);
  const [followUpUsed, setFollowUpUsed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    (q: Question[], pi: number, s: Score, da?: string[], fu?: string[]) => {
      saveSession(difficulty, {
        questions: q,
        progressIndex: pi,
        score: s,
        deepAnalyzeUsed: da ?? [],
        followUpUsed: fu ?? [],
      });
    },
    [difficulty],
  );

  useEffect(() => {
    const saved = loadSession(difficulty);
    if (saved && saved.questions.length > 0) {
      setQuestions(saved.questions);
      setProgressIndex(saved.progressIndex);
      setViewIndex(saved.progressIndex);
      setScore(saved.score);
      setDeepAnalyzeUsed(new Set(saved.deepAnalyzeUsed ?? []));
      setFollowUpUsed(new Set(saved.followUpUsed ?? []));
      setPhase("reading");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    (async () => {
      try {
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty }),
          signal: controller.signal,
        });

        if (cancelled) return;
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        setQuestions(data.questions);
        setPhase("reading");
        persist(data.questions, 0, { earned: 0, available: 0 });
      } catch (err) {
        if (cancelled) return;
        if (controller.signal.aborted) {
          setError("Question generation timed out. Please go back and try again.");
        } else {
          console.error("Failed to load questions:", err);
          setError("Failed to generate questions. Please go back and try again.");
        }
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [difficulty, persist]);

  const isViewingPrevious = viewIndex < progressIndex;
  const currentChunk: Chunk | undefined = chunks[viewIndex];
  const currentQuestion: Question | undefined = questions.find(
    (q) => q.chunkIndex === viewIndex,
  );
  const previousChunks = chunks.slice(0, viewIndex);
  const isLastChunk = progressIndex === chunks.length - 1;

  function handleBack() {
    if (viewIndex <= 0) return;
    setViewIndex((v) => v - 1);
  }

  function handleForward() {
    if (viewIndex >= progressIndex) return;
    setViewIndex((v) => v + 1);
  }

  function handleReturnToCurrent() {
    setViewIndex(progressIndex);
  }

  function handleAnswerSubmit(studentAnswer: string) {
    if (!currentQuestion) return;

    setLastAnswer(studentAnswer);
    const evaluation = evaluateAnswer(
      studentAnswer,
      currentQuestion.keyConcepts,
      currentQuestion.expectedAnswer,
      currentChunk?.text ?? "",
    );

    setLastEvaluation(evaluation);

    const newScore: Score = {
      earned: score.earned + evaluation.pointsEarned,
      available: score.available + evaluation.pointsAvailable,
    };
    setScore(newScore);
    setFeedbackState({ result: evaluation.result, feedback: evaluation.feedback });
    setPhase("feedback");
    persist(questions, progressIndex, newScore, [...deepAnalyzeUsed], [...followUpUsed]);
  }

  async function handleDeepAnalyze() {
    if (!currentChunk || !currentQuestion || !lastAnswer || !lastEvaluation) return;
    setAiReviewLoading(true);

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunkText: currentChunk.text,
          question: currentQuestion,
          studentAnswer: lastAnswer,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const aiResult: { result: AnswerResult; feedback: string } = await res.json();

      const newUsed = new Set(deepAnalyzeUsed);
      newUsed.add(currentQuestion.id);
      setDeepAnalyzeUsed(newUsed);

      const prevEarned = lastEvaluation.pointsEarned;
      const totalAvailable = lastEvaluation.pointsAvailable;

      let bonusPoints = 0;
      if (aiResult.result === "correct") {
        bonusPoints = totalAvailable - prevEarned;
      } else if (aiResult.result === "partial" && prevEarned === 0) {
        bonusPoints = Math.ceil(totalAvailable / 2);
      }

      if (bonusPoints > 0) {
        const updatedScore: Score = {
          earned: score.earned + bonusPoints,
          available: score.available,
        };
        setScore(updatedScore);
        persist(questions, progressIndex, updatedScore, [...newUsed], [...followUpUsed]);
      } else {
        persist(questions, progressIndex, score, [...newUsed], [...followUpUsed]);
      }

      setFeedbackState(aiResult);
    } catch (err) {
      console.error("AI review failed:", err);
    } finally {
      setAiReviewLoading(false);
    }
  }

  function advanceToNext() {
    setFeedbackState(null);
    setLastEvaluation(null);
    setFollowUp(null);
    setFollowUpResult(null);

    if (isLastChunk) {
      clearSession(difficulty);
      router.push(
        `/complete?earned=${score.earned}&available=${score.available}&difficulty=${difficulty}`,
      );
      return;
    }

    const next = progressIndex + 1;
    setProgressIndex(next);
    setViewIndex(next);
    setPhase("reading");
    persist(questions, next, score, [...deepAnalyzeUsed], [...followUpUsed]);
  }

  function handleContinue() {
    advanceToNext();
  }

  async function handleStartFollowUp() {
    if (!currentChunk || !currentQuestion || !feedbackState) return;

    setPhase("followup");
    setFollowUp(null);
    setFollowUpResult(null);
    setFollowUpLoading(true);

    try {
      const res = await fetch("/api/evaluate-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          chunkText: currentChunk.text,
          originalQuestion: currentQuestion,
          studentAnswer: lastAnswer,
          originalResult: feedbackState.result,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setFollowUp(data);
    } catch (err) {
      console.error("Follow-up generation failed:", err);
      advanceToNext();
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleFollowUpSubmit(answer: string) {
    if (!followUp || !currentChunk || !currentQuestion) return;

    setFollowUpSubmitting(true);

    try {
      const res = await fetch("/api/evaluate-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          chunkText: currentChunk.text,
          followUpQuestion: followUp.questionText,
          expectedAnswer: followUp.expectedAnswer,
          studentAnswer: answer,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data: FollowUpResponse = await res.json();
      setFollowUpResult(data);
      setPhase("followup-result");

      const newUsed = new Set(followUpUsed);
      newUsed.add(currentQuestion.id);
      setFollowUpUsed(newUsed);
      persist(questions, progressIndex, score, [...deepAnalyzeUsed], [...newUsed]);
    } catch (err) {
      console.error("Follow-up evaluation failed:", err);
    } finally {
      setFollowUpSubmitting(false);
    }
  }

  function handleFollowUpContinue() {
    advanceToNext();
  }

  function handleRestart() {
    clearSession(difficulty);
    router.push("/");
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            ← Back to start
          </button>
        </div>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-4" />
          <p className="text-sm text-gray-500">
            Generating questions for your reading...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">{passage.title}</h1>
          <div className="flex items-center gap-3">
            <ScoreBar earned={score.earned} available={score.available} />
            <button
              onClick={handleRestart}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              Restart
            </button>
          </div>
        </div>

        <PreviousChunks chunks={previousChunks} />

        {currentChunk && (
          <PassageChunk
            index={currentChunk.index}
            text={currentChunk.text}
            total={chunks.length}
          />
        )}

        {/* Navigation for viewing previous chunks */}
        {isViewingPrevious && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 text-center italic">
              You already answered this section.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={viewIndex <= 0}
                className="text-sm text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline cursor-pointer disabled:cursor-default"
              >
                ← Previous
              </button>
              <button
                onClick={viewIndex < progressIndex - 1 ? handleForward : handleReturnToCurrent}
                className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
              >
                {viewIndex < progressIndex - 1 ? "Next →" : "Return to current section →"}
              </button>
            </div>
          </div>
        )}

        {/* Active chunk flow */}
        {!isViewingPrevious && (
          <>
            {viewIndex > 0 && (phase === "reading" || phase === "answering") && (
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                ← Review previous section
              </button>
            )}

            {phase === "reading" && (
              <button
                onClick={() => setPhase("answering")}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                I&apos;ve read this - show me the question
              </button>
            )}

            {phase === "answering" && currentQuestion && (
              <QuestionCard
                questionText={currentQuestion.questionText}
                onSubmit={handleAnswerSubmit}
                disabled={false}
                marks={currentQuestion.keyConcepts.length}
              />
            )}

            {phase === "feedback" && feedbackState && (
              <>
                <QuestionCard
                  questionText={currentQuestion?.questionText ?? ""}
                  onSubmit={() => {}}
                  disabled={true}
                  marks={currentQuestion?.keyConcepts.length}
                />
                <FeedbackCard
                  result={feedbackState.result}
                  feedback={feedbackState.feedback}
                  pointsEarned={lastEvaluation?.pointsEarned}
                  pointsAvailable={lastEvaluation?.pointsAvailable}
                  onContinue={handleContinue}
                  onRequestAIReview={
                    currentQuestion &&
                    feedbackState.result !== "correct" &&
                    !deepAnalyzeUsed.has(currentQuestion.id) &&
                    !lastEvaluation?.isChunkDump
                      ? handleDeepAnalyze
                      : undefined
                  }
                  aiReviewLoading={aiReviewLoading}
                  onFollowUp={
                    currentQuestion &&
                    feedbackState.result !== "correct" &&
                    !followUpUsed.has(currentQuestion.id)
                      ? handleStartFollowUp
                      : undefined
                  }
                />
              </>
            )}

            {(phase === "followup" || phase === "followup-result") && (
              <FollowUpCard
                loading={followUpLoading}
                questionText={followUp?.questionText}
                hint={followUp?.hint}
                chunkText={currentChunk?.text}
                onSubmit={handleFollowUpSubmit}
                submitting={followUpSubmitting}
                result={followUpResult ?? undefined}
                onContinue={handleFollowUpContinue}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
