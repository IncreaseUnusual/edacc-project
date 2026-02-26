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
      const originalType: QuestionType = VALID_TYPES.has(q.type) ? q.type : "short-answer";

      const base = {
        id: randomUUID(),
        chunkIndex: q.chunkIndex,
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        keyConcepts: q.keyConcepts ?? [],
      };

      // --- drag-drop ---
      if (originalType === "drag-drop") {
        const dd = q.dragDrop;
        if (
          dd &&
          typeof dd.sentenceWithBlanks === "string" &&
          Array.isArray(dd.answers) &&
          dd.answers.length > 0 &&
          Array.isArray(dd.distractors)
        ) {
          return { ...base, type: "drag-drop" as const, dragDrop: dd };
        }
        return {
          ...base,
          type: "short-answer" as const,
          questionText: q.expectedAnswer
            ? `In your own words, explain: ${q.expectedAnswer}`
            : q.questionText,
        };
      }

      // --- highlight ---
      if (originalType === "highlight") {
        const hl = q.highlight;
        if (
          hl &&
          typeof hl.claim === "string" &&
          Array.isArray(hl.sentences) &&
          hl.sentences.length >= 2 &&
          typeof hl.correctIndex === "number" &&
          hl.correctIndex >= 0 &&
          hl.correctIndex < hl.sentences.length
        ) {
          return { ...base, type: "highlight" as const, highlight: hl };
        }
        const claim = hl?.claim ?? q.questionText;
        return {
          ...base,
          type: "short-answer" as const,
          questionText: `What evidence in the text supports this: "${claim}"?`,
        };
      }

      // --- reorder ---
      if (originalType === "reorder") {
        const ro = q.reorder;
        if (
          ro &&
          Array.isArray(ro.events) &&
          ro.events.length >= 3
        ) {
          return { ...base, type: "reorder" as const, reorder: ro };
        }
        return {
          ...base,
          type: "short-answer" as const,
          questionText: "Describe the sequence of main events in this section.",
        };
      }

      // --- short-answer (default) ---
      return { ...base, type: "short-answer" as const };
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
