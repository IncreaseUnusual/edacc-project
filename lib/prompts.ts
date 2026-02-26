import { Chunk, Difficulty } from "./types";

export function buildQuestionGenerationPrompt(
  passageTitle: string,
  chunks: Chunk[],
  difficulty: Difficulty,
): string {
  const difficultyGuidance: Record<Difficulty, string> = {
    easy: "Simple recall and basic understanding. Use clear, direct language suitable for younger or struggling readers (ages 7–10). Questions should be answerable in one or two sentences.",
    medium:
      "Mix of recall and inference. Expect students to connect ideas across sentences. Suitable for intermediate readers (ages 10–13).",
    hard: "Inference, synthesis, and critical thinking. Questions may require combining ideas across the chunk or drawing conclusions. Suitable for advanced readers (ages 12–15).",
  };

  const chunksDescription = chunks
    .map(
      (c) => `--- Chunk ${c.index} ---\n${c.text}`,
    )
    .join("\n\n");

  return `You are a reading comprehension question generator for an educational platform aimed at students aged 7–15.

PASSAGE TITLE: "${passageTitle}"

DIFFICULTY: ${difficulty}
GUIDANCE: ${difficultyGuidance[difficulty]}

CHUNKS:
${chunksDescription}

TASK:
Generate exactly ONE question per chunk. Each question should test understanding of that specific chunk's content.

RESPONSE FORMAT (strict JSON array):
[
  {
    "chunkIndex": <number>,
    "questionText": "<the question>",
    "expectedAnswer": "<a concise model answer>",
    "keyConceptsTested": ["<concept1>", "<concept2>"]
  }
]

RULES:
- Return ONLY the JSON array, no markdown or explanation.
- One question per chunk, in chunk order.
- Questions must be answerable from the chunk text alone.
- expectedAnswer should be 1–3 sentences.
- keyConceptsTested should list 1–3 key ideas the question covers.
- Do not repeat the same question type for every chunk — vary between who/what/why/how/explain.`;
}
