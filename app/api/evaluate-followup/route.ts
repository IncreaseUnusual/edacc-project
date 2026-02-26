import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import {
  buildFollowUpGenerationPrompt,
  buildFollowUpEvaluationPrompt,
} from "@/lib/prompts";
import { Difficulty, Question, AnswerResult, FollowUpResponse } from "@/lib/types";

const VALID_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const VALID_ORIGINAL_RESULTS = new Set<AnswerResult>(["partial", "incorrect"]);

type GenerateBody = {
  action: "generate";
  chunkText: string;
  originalQuestion: Question;
  studentAnswer: string;
  originalResult: "partial" | "incorrect";
  difficulty: Difficulty;
};

type EvaluateBody = {
  action: "evaluate";
  chunkText: string;
  followUpQuestion: string;
  expectedAnswer: string;
  studentAnswer: string;
  difficulty: Difficulty;
};

type GeneratedFollowUp = {
  questionText: string;
  hint: string;
  expectedAnswer: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.action || !VALID_DIFFICULTIES.has(body.difficulty)) {
      return NextResponse.json(
        { error: "Missing or invalid fields." },
        { status: 400 },
      );
    }

    if (body.action === "generate") {
      const {
        chunkText,
        originalQuestion,
        studentAnswer,
        originalResult,
        difficulty,
      } = body as GenerateBody;

      if (
        !chunkText ||
        !originalQuestion?.questionText ||
        !studentAnswer?.trim() ||
        !VALID_ORIGINAL_RESULTS.has(originalResult)
      ) {
        return NextResponse.json(
          { error: "Missing or invalid fields for follow-up generation." },
          { status: 400 },
        );
      }

      const prompt = buildFollowUpGenerationPrompt(
        chunkText,
        originalQuestion,
        studentAnswer,
        originalResult,
        difficulty,
      );

      const result = await generateJSON<GeneratedFollowUp>(prompt);

      if (!result.questionText || !result.expectedAnswer) {
        throw new Error("Unexpected follow-up generation format from AI");
      }

      return NextResponse.json(result);
    }

    if (body.action === "evaluate") {
      const {
        chunkText,
        followUpQuestion,
        expectedAnswer,
        studentAnswer,
        difficulty,
      } = body as EvaluateBody;

      if (
        !chunkText ||
        !followUpQuestion ||
        !expectedAnswer ||
        !studentAnswer?.trim()
      ) {
        return NextResponse.json(
          { error: "Missing or invalid fields for follow-up evaluation." },
          { status: 400 },
        );
      }

      const prompt = buildFollowUpEvaluationPrompt(
        chunkText,
        followUpQuestion,
        expectedAnswer,
        studentAnswer,
        difficulty,
      );

      const result = await generateJSON<FollowUpResponse>(prompt);

      if (
        !["correct", "incorrect"].includes(result.result) ||
        typeof result.feedback !== "string"
      ) {
        throw new Error("Unexpected follow-up evaluation format from AI");
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("evaluate-followup error:", error);
    return NextResponse.json(
      { error: "Failed to process follow-up. Please try again." },
      { status: 500 },
    );
  }
}
