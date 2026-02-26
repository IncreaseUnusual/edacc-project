import { AnswerResult, KeyConcept } from "./types";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/** More generous distance thresholds */
function maxDistance(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 5) return 1;
  if (word.length <= 7) return 2;
  return 3;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyContains(haystack: string, needle: string): boolean {
  if (haystack.includes(needle)) return true;

  const words = haystack.split(" ");
  const needleWords = needle.split(" ");

  if (needleWords.length === 1) {
    return words.some((w) => levenshtein(w, needle) <= maxDistance(needle));
  }

  // Multi-word keyword: check sliding window
  for (let i = 0; i <= words.length - needleWords.length; i++) {
    const window = words.slice(i, i + needleWords.length);
    const allMatch = needleWords.every((nw, j) =>
      levenshtein(window[j], nw) <= maxDistance(nw),
    );
    if (allMatch) return true;
  }

  // Subsequence match: keywords don't have to be adjacent
  if (needleWords.length >= 2 && needleWords.length <= 4) {
    let ni = 0;
    for (const w of words) {
      if (ni < needleWords.length && levenshtein(w, needleWords[ni]) <= maxDistance(needleWords[ni])) {
        ni++;
      }
    }
    if (ni === needleWords.length) return true;
  }

  return false;
}

function conceptMatched(answer: string, concept: KeyConcept): boolean {
  return concept.keywords.some((kw) => fuzzyContains(answer, normalize(kw)));
}

/**
 * Detect if the student literally copy-pasted the entire chunk verbatim.
 * Copying a sentence or most of the chunk is fine — only penalise a
 * near-1-to-1 paste of the whole thing.
 *
 * Triggers when the answer is both:
 * - Nearly as long as the chunk (>90% of chunk word count)
 * - Almost entirely chunk words   (>95% word overlap)
 */
function isChunkDump(answerNorm: string, chunkNorm: string): boolean {
  const answerWords = answerNorm.split(" ");
  const chunkWords = chunkNorm.split(" ");

  if (answerWords.length === 0 || chunkWords.length === 0) return false;

  // Length ratio: how much of the chunk did they paste?
  const lengthRatio = answerWords.length / chunkWords.length;
  if (lengthRatio < 0.9) return false; // Anything shorter than ~90% is fine

  // Word overlap: how many answer words come from the chunk?
  const chunkSet = new Set(chunkWords);
  let overlap = 0;
  for (const w of answerWords) {
    if (chunkSet.has(w)) overlap++;
  }
  const overlapRatio = overlap / answerWords.length;

  return overlapRatio > 0.95;
}

export type EvaluationResult = {
  result: AnswerResult;
  feedback: string;
  matchedConcepts: string[];
  missedConcepts: string[];
  /** Number of concept points earned */
  pointsEarned: number;
  /** Total concept points available for this question */
  pointsAvailable: number;
  /** True if the student dumped the whole chunk */
  isChunkDump: boolean;
};

export function evaluateAnswer(
  studentAnswer: string,
  keyConcepts: KeyConcept[],
  expectedAnswer: string,
  chunkText: string,
): EvaluationResult {
  const answer = normalize(studentAnswer);
  const chunkNorm = normalize(chunkText);
  const totalConcepts = keyConcepts.length;

  // --- Chunk dump detection ---
  const dump = isChunkDump(answer, chunkNorm);

  if (dump) {
    return {
      result: "incorrect",
      feedback:
        "It looks like you copied most of the passage. Try pulling out just the part that answers the question in your own words.",
      matchedConcepts: [],
      missedConcepts: keyConcepts.map((c) => c.concept),
      pointsEarned: 0,
      pointsAvailable: totalConcepts,
      isChunkDump: true,
    };
  }

  // --- Concept matching ---
  const matched: string[] = [];
  const missed: string[] = [];

  for (const concept of keyConcepts) {
    if (conceptMatched(answer, concept)) {
      matched.push(concept.concept);
    } else {
      missed.push(concept.concept);
    }
  }

  const pointsMatched = matched.length;

  // --- Generous scoring ---
  // With only 2-3 tightly-scoped concepts, matching at least half = correct (full points).
  // Matching anything but not half = partial (points for what they got).
  // Matching nothing = incorrect.
  const halfOrMore = pointsMatched >= Math.ceil(totalConcepts / 2);

  let result: AnswerResult;
  let feedback: string;
  let pointsEarned: number;

  if (pointsMatched === 0) {
    result = "incorrect";
    pointsEarned = 0;
    feedback = `No concepts matched. Have another look at the passage. Think about: ${missed.join(", ")}. If your answer captures the idea in different words, you can request an AI review.`;
  } else if (halfOrMore) {
    // At least half the concepts matched — treat as correct with full marks
    result = "correct";
    pointsEarned = totalConcepts;
    feedback = pointsMatched === totalConcepts
      ? `Full marks! You got all ${totalConcepts} concept${totalConcepts > 1 ? "s" : ""}.`
      : `Great answer! You covered: ${matched.join(", ")}.`;
  } else {
    // Matched something but less than half — partial, award what they got
    result = "partial";
    pointsEarned = pointsMatched;
    feedback = `You got ${pointsMatched}/${totalConcepts} concepts. You covered: ${matched.join(", ")}. Think about: ${missed.join(", ")}. If you feel your answer is right, try the AI review.`;
  }

  return {
    result,
    feedback,
    matchedConcepts: matched,
    missedConcepts: missed,
    pointsEarned,
    pointsAvailable: totalConcepts,
    isChunkDump: false,
  };
}
