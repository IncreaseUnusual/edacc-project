import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { buildQuestionGenerationPrompt } from "@/lib/prompts";
import { getChunks, passage } from "@/lib/passage";
import { Difficulty, Question, QuestionType } from "@/lib/types";
import { randomUUID } from "crypto";

const VALID_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
const VALID_TYPES = new Set<QuestionType>(["short-answer", "drag-drop", "highlight", "reorder"]);

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
    const raw = await generateJSON<GeneratedQuestion[] | Record<string, unknown>>(prompt);

    const arr: GeneratedQuestion[] = Array.isArray(raw)
      ? raw
      : Array.isArray(Object.values(raw)[0])
        ? (Object.values(raw)[0] as GeneratedQuestion[])
        : (() => { throw new Error("Unexpected AI response shape"); })();

    const questions: Question[] = arr.map((q) => {
      let type: QuestionType = VALID_TYPES.has(q.type) ? q.type : "short-answer";

      const base = {
        id: randomUUID(),
        chunkIndex: q.chunkIndex,
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        keyConcepts: q.keyConcepts ?? [],
        type,
      };

      if (type === "drag-drop" && q.dragDrop) {
        const dd = q.dragDrop;
        if (
          typeof dd.sentenceWithBlanks === "string" &&
          Array.isArray(dd.answers) &&
          dd.answers.length > 0 &&
          Array.isArray(dd.distractors)
        ) {
          return { ...base, dragDrop: dd };
        }
        type = "short-answer";
        return { ...base, type };
      }

      if (type === "highlight" && q.highlight) {
        const hl = q.highlight;
        if (
          typeof hl.claim === "string" &&
          Array.isArray(hl.sentences) &&
          hl.sentences.length >= 2 &&
          typeof hl.correctIndex === "number" &&
          hl.correctIndex >= 0 &&
          hl.correctIndex < hl.sentences.length
        ) {
          return { ...base, highlight: hl };
        }
        type = "short-answer";
        return { ...base, type };
      }

      if (type === "reorder" && q.reorder) {
        const ro = q.reorder;
        if (
          Array.isArray(ro.events) &&
          ro.events.length >= 3
        ) {
          return { ...base, reorder: ro };
        }
        type = "short-answer";
        return { ...base, type };
      }

      return base;
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("generate-questions error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 },
    );
  }
}
