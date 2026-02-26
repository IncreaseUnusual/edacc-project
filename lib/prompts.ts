import { Chunk, Difficulty, Question } from "./types";

export function buildQuestionGenerationPrompt(
  passageTitle: string,
  chunks: Chunk[],
  difficulty: Difficulty,
): string {
  const difficultyGuidance: Record<Difficulty, string> = {
    easy: "Simple recall questions. Ask WHO, WHAT, or WHERE questions with answers stated directly in the text. Use clear, direct language suitable for younger readers (ages 7-10). Questions should be answerable in one sentence.",
    medium:
      "Mix of recall and inference. Some questions should ask WHY or HOW, requiring the student to connect two ideas from the text. Suitable for intermediate readers (ages 10-13).",
    hard: `Higher-order thinking ONLY. Do NOT ask simple recall or "what" questions. Every question MUST require the student to:
- INFER something not explicitly stated (e.g. "Why do you think...?", "What would happen if...?")
- EXPLAIN a cause-and-effect relationship (e.g. "How does X lead to Y?")
- COMPARE or CONTRAST ideas (e.g. "How are X and Y different?")
- EVALUATE or DRAW CONCLUSIONS (e.g. "What does this tell us about...?")
Suitable for advanced readers (ages 12-15). The answer should require 2-3 sentences of reasoning, not just restating a fact.`,
  };

  const chunksDescription = chunks
    .map(
      (c) => `--- Chunk ${c.index} ---\n${c.text}`,
    )
    .join("\n\n");

  // Random seed to force the AI to vary questions each session
  const angles = [
    "cause and effect", "comparison", "purpose", "sequence", "vocabulary in context",
    "main idea", "supporting detail", "prediction", "author's intent", "summarization",
  ];
  const shuffled = angles.sort(() => Math.random() - 0.5);
  const suggestedAngles = shuffled.slice(0, 4).join(", ");

  return `You are a reading comprehension question generator for an educational platform aimed at students aged 7-15.

PASSAGE TITLE: "${passageTitle}"

DIFFICULTY: ${difficulty}
GUIDANCE: ${difficultyGuidance[difficulty]}

VARIATION SEED: ${Date.now()}
Try to focus on these question angles this session: ${suggestedAngles}.
Each time you generate questions, pick DIFFERENT aspects of the text to ask about. Avoid always asking the most obvious question. Surprise the student.

CHUNKS:
${chunksDescription}

TASK:
Generate exactly ONE question per chunk. Each question should test understanding of that specific chunk's content.

For each question, provide ONLY 2-3 key concepts. IMPORTANT: every concept must be something the student MUST mention to correctly answer THIS SPECIFIC QUESTION. Do NOT include background knowledge, tangential facts, or concepts from other parts of the chunk that aren't needed for the answer. If the question is "Why does X happen?", the concepts should only be about the reason, not about what X is.

Each concept must include a VERY GENEROUS list of acceptable keywords/phrases (at least 10-20 variants). Think broadly about every possible way a student could express the idea:
- The exact words from the passage
- Synonyms and paraphrases (e.g. "job" -> "role", "task", "purpose", "responsibility", "duty")
- Simplified/child-friendly rewordings (e.g. "forager" -> "collector", "food gatherer", "bee that gets food")
- Both numeric ("60,000", "60000") and written ("sixty thousand", "60 thousand") forms for numbers
- Common misspellings (e.g. "recieve", "seperate", "coloney")
- Singular and plural forms (e.g. "egg", "eggs")
- Short phrases (2-4 words) that capture the idea, not just single words
- Partial matches: if the concept is "lays up to 2000 eggs", include "lays eggs", "produces eggs", "makes eggs", "2000", "two thousand", "thousands of eggs"
- Verb form variations (e.g. "laying", "lays", "lay", "laid")
- Informal language a child might use (e.g. "makes babies", "has babies" for "lays eggs")

RESPONSE FORMAT (strict JSON array):
[
  {
    "chunkIndex": <number>,
    "questionText": "<the question>",
    "expectedAnswer": "<a concise model answer>",
    "keyConcepts": [
      {
        "concept": "<short label for the concept>",
        "keywords": ["<keyword1>", "<keyword2>", "...at least 10-20 variants..."]
      }
    ]
  }
]

RULES:
- Return ONLY the JSON array, no markdown or explanation.
- One question per chunk, in chunk order.
- Questions must be answerable from the chunk text alone.
- expectedAnswer should be 1-3 sentences.
- MAXIMUM 3 concepts per question. Only include concepts that DIRECTLY answer the question.
- Each concept MUST have at least 10-20 keyword variants. More is better. Be extremely generous.
- Keywords should be lowercase.
- Do not repeat the same question type for every chunk - vary between who/what/why/how/explain.
- Remember: a student who understood the passage but uses different words should still match. Err on the side of too many keywords rather than too few.`;
}

export function buildDeepEvaluationPrompt(
  chunkText: string,
  question: Question,
  studentAnswer: string,
  difficulty: Difficulty,
): string {
  const lenience: Record<Difficulty, string> = {
    easy: "Be generous. Accept answers that show basic understanding even if wording is imprecise. These are young learners (ages 7-10).",
    medium: "Be fair. Expect the key idea to be present but don't require exact phrasing. Suitable for ages 10-13.",
    hard: "Be thorough. Expect the student to demonstrate clear understanding of the concept. Suitable for ages 12-15.",
  };

  return `You are an answer evaluator for a reading comprehension platform for students aged 7-15.

PASSAGE CHUNK:
"${chunkText}"

QUESTION: "${question.questionText}"
EXPECTED ANSWER: "${question.expectedAnswer}"
KEY CONCEPTS: ${question.keyConcepts.map((c) => c.concept).join(", ")}

STUDENT'S ANSWER: "${studentAnswer}"

DIFFICULTY: ${difficulty}
LENIENCE: ${lenience[difficulty]}

TASK:
The student's answer failed an automated keyword check but may still be correct. Evaluate whether their answer demonstrates genuine understanding of the key concepts, even if they used different wording.

RESPONSE FORMAT (strict JSON object):
{
  "result": "correct" | "partial" | "incorrect",
  "feedback": "<2-3 sentences: warm, encouraging, specific to what they got right or missed>"
}

RULES:
- "correct": student captured the key concept(s), even if wording differs from expected answer.
- "partial": student showed some understanding but missed an important part.
- "incorrect": student's answer is wrong, off-topic, or too vague to demonstrate understanding.
- Feedback must be encouraging and age-appropriate. Never be harsh.
- Reference specific parts of their answer when giving feedback.
- If incorrect or partial, gently point toward what they should look for in the passage.
- Return ONLY the JSON object, no markdown or explanation.`;
}

export function buildFollowUpGenerationPrompt(
  chunkText: string,
  originalQuestion: Question,
  studentAnswer: string,
  originalResult: "partial" | "incorrect",
  difficulty: Difficulty,
): string {
  return `You are a reading comprehension tutor for students aged 7-15.

A student just answered a question ${originalResult === "incorrect" ? "incorrectly" : "partially"}.

PASSAGE CHUNK:
"${chunkText}"

ORIGINAL QUESTION: "${originalQuestion.questionText}"
EXPECTED ANSWER: "${originalQuestion.expectedAnswer}"
STUDENT'S ANSWER: "${studentAnswer}"
RESULT: ${originalResult}
DIFFICULTY: ${difficulty}

TASK:
Generate ONE follow-up question that helps the student find the correct answer. The follow-up should:
- Be simpler and more targeted than the original question
- Point the student toward the specific part of the passage they missed
- Be answerable from the same chunk
- Include a gentle hint that narrows focus without giving the answer away

RESPONSE FORMAT (strict JSON object):
{
  "questionText": "<the follow-up question>",
  "hint": "<a gentle hint to guide the student>",
  "expectedAnswer": "<what a correct answer looks like>"
}

RULES:
- Return ONLY the JSON object, no markdown or explanation.
- Keep the question age-appropriate and encouraging.
- The follow-up must be noticeably easier or more specific than the original.
- The hint should narrow the focus without revealing the answer.`;
}

export function buildFollowUpEvaluationPrompt(
  chunkText: string,
  followUpQuestion: string,
  expectedAnswer: string,
  studentAnswer: string,
  difficulty: Difficulty,
): string {
  return `You are an answer evaluator for a reading comprehension platform for students aged 7-15.

PASSAGE CHUNK:
"${chunkText}"

FOLLOW-UP QUESTION: "${followUpQuestion}"
EXPECTED ANSWER: "${expectedAnswer}"
STUDENT'S ANSWER: "${studentAnswer}"
DIFFICULTY: ${difficulty}

TASK:
Evaluate whether the student's answer to the follow-up question is correct. Be generous — if the student shows understanding of the key idea, mark it correct.

RESPONSE FORMAT (strict JSON object):
{
  "result": "correct" | "incorrect",
  "feedback": "<1-2 warm, encouraging sentences>",
  "correctAnswer": "<the correct answer — shown only if result is incorrect, null if correct>"
}

RULES:
- Return ONLY the JSON object, no markdown or explanation.
- "correct": student demonstrated understanding, even with different wording.
- "incorrect": answer is wrong, off-topic, or too vague.
- If incorrect, set correctAnswer to a clear, student-friendly explanation of the answer.
- If correct, set correctAnswer to null.
- Feedback must be warm and encouraging regardless of result.`;
}

export function buildSummaryPrompt(
  passageTitle: string,
  passageContent: string,
  difficulty: Difficulty,
  earned: number,
  available: number,
): string {
  const pct = available > 0 ? Math.round((earned / available) * 100) : 0;

  return `You are a warm, encouraging reading tutor for students aged 7-15.

PASSAGE TITLE: "${passageTitle}"
PASSAGE:
"${passageContent}"

DIFFICULTY: ${difficulty}
SCORE: ${earned}/${available} (${pct}%)

TASK:
Write a short learning summary for the student who just finished reading this passage and answering comprehension questions.

RESPONSE FORMAT (strict JSON object):
{
  "headline": "<a short, encouraging headline — 5-10 words>",
  "summary": "<2-4 sentences summarising the key things the student should take away from the passage>",
  "encouragement": "<1-2 sentences of personalised encouragement based on their score>"
}

RULES:
- Return ONLY the JSON object, no markdown or explanation.
- If score is high (≥80%), celebrate enthusiastically.
- If score is moderate (50-79%), acknowledge effort and highlight what they learned.
- If score is low (<50%), be extra kind — emphasise that reading is a journey and they still learned something.
- The summary should mention 2-3 specific facts from the passage so the student feels they gained knowledge.
- Use age-appropriate, warm language. Never be condescending.
- Keep the headline fun and upbeat regardless of score.`;
}
