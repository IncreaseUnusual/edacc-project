import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { buildSummaryPrompt } from "@/lib/prompts";
import { Difficulty } from "@/lib/types";
import { passage } from "@/lib/passage";

const VALID_DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

type SummaryRequest = {
  difficulty: Difficulty;
  earned: number;
  available: number;
};

type SummaryResult = {
  headline: string;
  summary: string;
  encouragement: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SummaryRequest>;

    if (
      !body.difficulty ||
      !VALID_DIFFICULTIES.has(body.difficulty) ||
      typeof body.earned !== "number" ||
      typeof body.available !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields." },
        { status: 400 },
      );
    }

    const prompt = buildSummaryPrompt(
      passage.title,
      passage.content,
      body.difficulty,
      body.earned,
      body.available,
    );

    const result = await generateJSON<SummaryResult>(prompt);

    if (
      typeof result.headline !== "string" ||
      typeof result.summary !== "string" ||
      typeof result.encouragement !== "string"
    ) {
      throw new Error("Unexpected summary format from AI");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("generate-summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 },
    );
  }
}
