import { Chunk, Difficulty, Question, QuestionType } from "./types";

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildTypeMix(
  chunkCount: number,
  difficulty: Difficulty,
): { typeAssignments: QuestionType[]; instruction: string } {
  const saCount = difficulty === "easy" ? 0 : 1;
  const interactiveTypes: QuestionType[] = ["drag-drop", "highlight", "reorder"];

  const types: QuestionType[] = [];
  for (let i = 0; i < saCount; i++) types.push("short-answer");
  for (let i = 0; i < chunkCount - saCount; i++) {
    types.push(interactiveTypes[i % interactiveTypes.length]);
  }

  const assignments = shuffleArray(types);

  const lines = assignments.map(
    (t, i) => `Chunk ${i} → "${t}"`,
  );

  return {
    typeAssignments: assignments,
    instruction: `QUESTION TYPE MIX (follow exactly):\n${lines.join("\n")}`,
  };
}

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

  const angles = [
    "cause and effect", "comparison", "purpose", "sequence", "vocabulary in context",
    "main idea", "supporting detail", "prediction", "author's intent", "summarization",
  ];
  const shuffled = angles.sort(() => Math.random() - 0.5);
  const suggestedAngles = shuffled.slice(0, 4).join(", ");

  const { instruction: mixInstruction } = buildTypeMix(chunks.length, difficulty);

  return `You are a reading comprehension question generator for an educational platform aimed at students aged 7-15.

PASSAGE TITLE: "${passageTitle}"

DIFFICULTY: ${difficulty}
GUIDANCE: ${difficultyGuidance[difficulty]}

VARIATION SEED: ${Date.now()}
Try to focus on these question angles this session: ${suggestedAngles}.
Each time you generate questions, pick DIFFERENT aspects of the text to ask about. Avoid always asking the most obvious question. Surprise the student.

${mixInstruction}

CHUNKS:
${chunksDescription}

TASK:
Generate exactly ONE question per chunk. Each question should test understanding of that specific chunk's content.

There are FOUR question types:

### TYPE 1: "short-answer"
The student types a free-text answer.
For each question, provide 2-3 key concepts with generous keyword lists (at least 10-20 variants each).

### TYPE 2: "drag-drop"
The student fills blanks in a sentence by tapping words from a word bank.
For each drag-drop question:
- Create a sentence based on the chunk with 2-3 key words replaced by blanks: __1__, __2__, __3__
- Provide the correct answers in order (one per blank)
- Provide 2-3 distractor words (plausible but wrong) — same word type as the answers
- Answers and distractors should be single words or very short phrases (1-3 words max)

### TYPE 3: "highlight"
"Which part of the text proves this?" — the student reads a claim and taps the sentence that supports it.
For each highlight question:
- Write a claim (the questionText) that one sentence in the chunk clearly proves
- Split the chunk into individual sentences (3-6 sentences)
- Provide the 0-based index of the correct proving sentence
- The claim must NOT copy the sentence verbatim — rephrase it

### TYPE 4: "reorder"
"Put these events in order" — the student arranges 3-5 events from the chunk chronologically.
For each reorder question:
- Extract 3-5 short event descriptions from the chunk
- List them in the CORRECT chronological order
- Events should be concise (under 15 words each)
- At least 3 events, at most 5

RESPONSE FORMAT (strict JSON array):
[
  {
    "chunkIndex": <number>,
    "type": "short-answer" | "drag-drop" | "highlight" | "reorder",
    "questionText": "<the question, instruction, or claim>",
    "expectedAnswer": "<a concise model answer>",
    "keyConcepts": [
      {
        "concept": "<short label>",
        "keywords": ["<keyword1>", "<keyword2>", "...at least 10-20 variants..."]
      }
    ],
    "dragDrop": {
      "sentenceWithBlanks": "<sentence with __1__, __2__ etc>",
      "answers": ["<correct word for blank 1>", "<correct word for blank 2>"],
      "distractors": ["<wrong option 1>", "<wrong option 2>"]
    },
    "highlight": {
      "claim": "<the claim the student must find proof for>",
      "sentences": ["<sentence 1>", "<sentence 2>", "..."],
      "correctIndex": <0-based index>
    },
    "reorder": {
      "events": ["<event 1 in correct order>", "<event 2>", "<event 3>", "..."]
    }
  }
]

RULES:
- Return ONLY the JSON array, no markdown or explanation.
- One question per chunk, in chunk order.
- Questions must be answerable from the chunk text alone.
- For "short-answer": include keyConcepts with 10-20+ keyword variants each. Set dragDrop, highlight, reorder to null.
- For "drag-drop": include dragDrop object. keyConcepts can be minimal. Set highlight, reorder to null.
- For "highlight": include highlight object. keyConcepts can be minimal. Set dragDrop, reorder to null.
- For "reorder": include reorder object. keyConcepts can be minimal. Set dragDrop, highlight to null.
- expectedAnswer should be 1-3 sentences for short-answer, the completed sentence for drag-drop, the proving sentence for highlight, or "Events in order: 1, 2, 3..." for reorder.
- MAXIMUM 3 concepts per question.
- Keywords should be lowercase.
- Do not repeat the same question style for every chunk.
- Drag-drop distractors must be plausible but clearly wrong if you read the passage.
- Highlight sentences must be actual sentences from the chunk, not paraphrased.
- Reorder events must reflect the sequence in the passage.`;
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
