import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { buildDeepEvaluationPrompt } from "@/lib/prompts";
import { Difficulty, Question, AnswerResult } from "@/lib/types";

type DeepEvalRequest = {
  chunkText: string;
  question: Question;
  studentAnswer: string;
  difficulty: Difficulty;
};

type EvalResult = {
  result: AnswerResult;
  feedback: string;
};

const VALID_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const VALID_RESULTS = new Set<AnswerResult>(["correct", "partial", "incorrect"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DeepEvalRequest>;

    if (
      !body.chunkText ||
      !body.question ||
      !body.studentAnswer?.trim() ||
      !body.difficulty ||
      !VALID_DIFFICULTIES.has(body.difficulty)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields." },
        { status: 400 },
      );
    }

    const prompt = buildDeepEvaluationPrompt(
      body.chunkText,
      body.question,
      body.studentAnswer,
      body.difficulty,
    );

    const evaluation = await generateJSON<EvalResult>(prompt);

    if (!VALID_RESULTS.has(evaluation.result) || typeof evaluation.feedback !== "string") {
      throw new Error("Unexpected evaluation format from Gemini");
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("evaluate-answer error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer. Please try again." },
      { status: 500 },
    );
  }
}
