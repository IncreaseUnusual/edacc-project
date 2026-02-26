"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AnswerResult, Chunk, Difficulty, FollowUpResponse, Question } from "@/lib/types";
import { evaluateAnswer, evaluateDragDrop, evaluateHighlight, evaluateReorder, EvaluationResult } from "@/lib/evaluate";
import { getChunks, passage } from "@/lib/passage";
import { fireCorrectConfetti } from "@/lib/confetti";
import { ScoreBar } from "@/components/ScoreBar";
import { ProgressStepper } from "@/components/ProgressStepper";
import { StreakCounter } from "@/components/StreakCounter";
import { PassageChunk } from "@/components/PassageChunk";
import { PreviousChunks } from "@/components/PreviousChunks";
import { QuestionCard } from "@/components/QuestionCard";
import { DragDropCard } from "@/components/DragDropCard";
import { HighlightCard } from "@/components/HighlightCard";
import { ReorderCard } from "@/components/ReorderCard";
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
  streak: number;
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
  const [streak, setStreak] = useState(0);
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
  const [aiError, setAiError] = useState<string | null>(null);

  const persist = useCallback(
    (q: Question[], pi: number, s: Score, da?: string[], fu?: string[], st?: number) => {
      saveSession(difficulty, {
        questions: q,
        progressIndex: pi,
        score: s,
        deepAnalyzeUsed: da ?? [],
        followUpUsed: fu ?? [],
        streak: st ?? 0,
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
      setStreak(saved.streak ?? 0);
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
  const isDragDrop = currentQuestion?.type === "drag-drop" && currentQuestion.dragDrop;
  const isHighlight = currentQuestion?.type === "highlight" && currentQuestion.highlight;
  const isReorder = currentQuestion?.type === "reorder" && currentQuestion.reorder;
  const isInteractive = isDragDrop || isHighlight || isReorder;

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

  function applyEvaluation(evaluation: EvaluationResult) {
    setLastEvaluation(evaluation);

    const newStreak = evaluation.result === "correct" ? streak + 1 : 0;
    setStreak(newStreak);

    if (evaluation.result === "correct") {
      fireCorrectConfetti();
    }

    const newScore: Score = {
      earned: score.earned + evaluation.pointsEarned,
      available: score.available + evaluation.pointsAvailable,
    };
    setScore(newScore);
    setFeedbackState({ result: evaluation.result, feedback: evaluation.feedback });
    setPhase("feedback");
    persist(questions, progressIndex, newScore, [...deepAnalyzeUsed], [...followUpUsed], newStreak);
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

    applyEvaluation(evaluation);
  }

  function handleDragDropSubmit(placements: string[]) {
    if (!currentQuestion?.dragDrop) return;
    setLastAnswer(placements.join(", "));

    const evaluation = evaluateDragDrop(placements, currentQuestion.dragDrop);
    applyEvaluation(evaluation);
  }

  function handleHighlightSubmit(selectedIndex: number) {
    if (!currentQuestion?.highlight) return;
    setLastAnswer(currentQuestion.highlight.sentences[selectedIndex] ?? "");

    const evaluation = evaluateHighlight(selectedIndex, currentQuestion.highlight);
    applyEvaluation(evaluation);
  }

  function handleReorderSubmit(order: string[]) {
    if (!currentQuestion?.reorder) return;
    setLastAnswer(order.join(" → "));

    const evaluation = evaluateReorder(order, currentQuestion.reorder);
    applyEvaluation(evaluation);
  }

  async function handleDeepAnalyze() {
    if (!currentChunk || !currentQuestion || !lastAnswer || !lastEvaluation) return;
    setAiReviewLoading(true);
    setAiError(null);

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
        const newStreak = aiResult.result === "correct" ? streak + 1 : streak;
        if (aiResult.result === "correct") fireCorrectConfetti();
        setStreak(newStreak);

        const updatedScore: Score = {
          earned: score.earned + bonusPoints,
          available: score.available,
        };
        setScore(updatedScore);
        persist(questions, progressIndex, updatedScore, [...newUsed], [...followUpUsed], newStreak);
      } else {
        persist(questions, progressIndex, score, [...newUsed], [...followUpUsed], streak);
      }

      setFeedbackState(aiResult);
    } catch (err) {
      console.error("AI review failed:", err);
      setAiError("AI review ran into a problem — you can still continue.");
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
    persist(questions, next, score, [...deepAnalyzeUsed], [...followUpUsed], streak);
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
    setAiError(null);

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
      setAiError("Couldn\u2019t generate a follow-up question right now.");
      setPhase("feedback");
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleFollowUpSubmit(answer: string) {
    if (!followUp || !currentChunk || !currentQuestion) return;

    setFollowUpSubmitting(true);
    setAiError(null);

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
      persist(questions, progressIndex, score, [...deepAnalyzeUsed], [...newUsed], streak);
    } catch (err) {
      console.error("Follow-up evaluation failed:", err);
      setAiError("Couldn\u2019t evaluate your follow-up — you can still move on.");
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
        <div className="w-full max-w-2xl text-center space-y-4">
          <span className="text-4xl font-bold text-red-300">!</span>
          <p className="text-lg font-semibold text-gray-800">Something went wrong</p>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-block rounded-full border-2 border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
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
        <div className="w-full max-w-2xl text-center space-y-4">
          <div className="text-4xl animate-bounce font-bold text-amber-400">~</div>
          <p className="text-sm font-medium text-gray-600">
            Getting your reading session ready&hellip;
          </p>
          <p className="text-xs text-gray-400">This usually takes a few seconds</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 sm:px-6 py-6 sm:py-12">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-800">{passage.title}</h1>
            <button
              onClick={handleRestart}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-1.5 -mr-2 min-h-[36px] flex items-center"
            >
              Restart
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <ProgressStepper
              total={chunks.length}
              current={progressIndex}
              completed={progressIndex}
            />
            <div className="flex items-center gap-2">
              <StreakCounter streak={streak} />
              <ScoreBar earned={score.earned} available={score.available} />
            </div>
          </div>
        </div>

        <PreviousChunks chunks={previousChunks} />

        {currentChunk && (
          <div key={`chunk-${currentChunk.index}`} className="animate-fade-in-up">
            <PassageChunk
              index={currentChunk.index}
              text={currentChunk.text}
              total={chunks.length}
            />
          </div>
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
                className="text-sm text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline cursor-pointer disabled:cursor-default py-2 pr-4 min-h-[44px] flex items-center"
              >
                ← Previous
              </button>
              <button
                onClick={viewIndex < progressIndex - 1 ? handleForward : handleReturnToCurrent}
                className="text-sm font-medium text-blue-600 hover:underline cursor-pointer py-2 pl-4 min-h-[44px] flex items-center"
              >
                {viewIndex < progressIndex - 1 ? "Next →" : "Return to current section →"}
              </button>
            </div>
          </div>
        )}

        {/* Active chunk flow */}
        {!isViewingPrevious && (
          <>
            {aiError && (
              <div className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 px-4 py-3 flex items-start gap-2 card-shadow">
                <span className="text-amber-500 text-sm mt-0.5 font-bold">!</span>
                <div className="flex-1">
                  <p className="text-sm text-amber-800">{aiError}</p>
                </div>
                <button
                  onClick={() => setAiError(null)}
                  className="text-amber-400 hover:text-amber-600 text-xs cursor-pointer p-1"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

            {viewIndex > 0 && (phase === "reading" || phase === "answering") && (
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-blue-600 transition-colors cursor-pointer py-2 pr-4 min-h-[44px] flex items-center"
              >
                ← Review previous section
              </button>
            )}

            {phase === "reading" && (
              <div className="animate-fade-in-up">
                <button
                  onClick={() => setPhase("answering")}
                  className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors cursor-pointer min-h-[48px] active:scale-[0.98] shadow-md shadow-sky-200"
                >
                  I&apos;ve read this — show me the question
                </button>
              </div>
            )}

            {phase === "answering" && currentQuestion && (
              <div className="animate-fade-in-up">
                {isDragDrop ? (
                  <DragDropCard
                    questionText={currentQuestion.questionText}
                    dragDrop={currentQuestion.dragDrop!}
                    onSubmit={handleDragDropSubmit}
                    disabled={false}
                  />
                ) : isHighlight ? (
                  <HighlightCard
                    questionText={currentQuestion.questionText}
                    data={currentQuestion.highlight!}
                    onSubmit={handleHighlightSubmit}
                    disabled={false}
                  />
                ) : isReorder ? (
                  <ReorderCard
                    questionText={currentQuestion.questionText}
                    data={currentQuestion.reorder!}
                    onSubmit={handleReorderSubmit}
                    disabled={false}
                  />
                ) : (
                  <QuestionCard
                    questionText={currentQuestion.questionText}
                    onSubmit={handleAnswerSubmit}
                    disabled={false}
                    marks={currentQuestion.keyConcepts.length}
                  />
                )}
              </div>
            )}

            {phase === "feedback" && feedbackState && (
              <div className="animate-fade-in-up space-y-5">
                {!isInteractive && (
                  <QuestionCard
                    questionText={currentQuestion?.questionText ?? ""}
                    onSubmit={() => {}}
                    disabled={true}
                    marks={currentQuestion?.keyConcepts.length}
                  />
                )}
                <FeedbackCard
                  result={feedbackState.result}
                  feedback={feedbackState.feedback}
                  pointsEarned={lastEvaluation?.pointsEarned}
                  pointsAvailable={lastEvaluation?.pointsAvailable}
                  onContinue={handleContinue}
                  onRequestAIReview={
                    currentQuestion &&
                    !isInteractive &&
                    feedbackState.result !== "correct" &&
                    !deepAnalyzeUsed.has(currentQuestion.id) &&
                    !lastEvaluation?.isChunkDump
                      ? handleDeepAnalyze
                      : undefined
                  }
                  aiReviewLoading={aiReviewLoading}
                  onFollowUp={
                    currentQuestion &&
                    !isInteractive &&
                    feedbackState.result !== "correct" &&
                    !followUpUsed.has(currentQuestion.id)
                      ? handleStartFollowUp
                      : undefined
                  }
                />
              </div>
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
          <span className="text-2xl animate-bounce font-bold text-amber-400">~</span>
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
