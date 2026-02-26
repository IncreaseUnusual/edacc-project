import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { buildQuestionGenerationPrompt } from "@/lib/prompts";
import { getChunks, passage } from "@/lib/passage";
import { Difficulty, Question } from "@/lib/types";
import { randomUUID } from "crypto";

const VALID_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

type GeneratedQuestion = Omit<Question, "id">;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { difficulty } = body as { difficulty?: string };

    if (!difficulty || !VALID_DIFFICULTIES.has(difficulty as Difficulty)) {
      return NextResponse.json(
        { error: "Invalid or missing difficulty. Must be easy, medium, or hard." },
        { status: 400 },
      );
    }

    const diff = difficulty as Difficulty;
    const chunks = getChunks(diff);
    const prompt = buildQuestionGenerationPrompt(passage.title, chunks, diff);
    const raw = await generateJSON<GeneratedQuestion[]>(prompt);

    const questions: Question[] = raw.map((q) => ({
      id: randomUUID(),
      chunkIndex: q.chunkIndex,
      questionText: q.questionText,
      expectedAnswer: q.expectedAnswer,
      keyConceptsTested: q.keyConceptsTested,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("generate-questions error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 },
    );
  }
}
