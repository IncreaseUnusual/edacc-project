export type Difficulty = "easy" | "medium" | "hard";

export type Passage = {
  id: string;
  title: string;
  content: string;
};

export type Chunk = {
  index: number;
  text: string;
};

export type KeyConcept = {
  concept: string;
  keywords: string[];
};

export type QuestionType = "short-answer" | "drag-drop" | "highlight" | "reorder";

export type DragDropData = {
  sentenceWithBlanks: string;
  answers: string[];
  distractors: string[];
};

export type HighlightData = {
  claim: string;
  sentences: string[];
  correctIndex: number;
};

export type ReorderData = {
  events: string[];
};

export type Question = {
  id: string;
  chunkIndex: number;
  questionText: string;
  expectedAnswer: string;
  keyConcepts: KeyConcept[];
  type: QuestionType;
  dragDrop?: DragDropData;
  highlight?: HighlightData;
  reorder?: ReorderData;
};

export type AnswerResult = "correct" | "partial" | "incorrect";

export type EvaluationResponse = {
  result: AnswerResult;
  feedback: string;
  followUp: {
    questionText: string;
    hint: string;
  } | null;
};

export type FollowUpResponse = {
  result: "correct" | "incorrect";
  feedback: string;
  correctAnswer: string | null;
};

export type AnswerRecord = {
  questionId: string;
  studentAnswer: string;
  result: AnswerResult;
  attempts: number;
};

export type SessionState = {
  difficulty: Difficulty;
  chunks: Chunk[];
  questions: Question[];
  currentChunkIndex: number;
  answers: AnswerRecord[];
  score: { correct: number; total: number };
  phase: "welcome" | "reading" | "complete";
};
