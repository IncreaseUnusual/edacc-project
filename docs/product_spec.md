# Product Spec: AI Reading Comprehension Interface

## Overview

A standalone Next.js app that reimagines EdAccelerator's reading comprehension experience. The current tool treats comprehension as a test. This rebuild treats it as **guided learning** — chunked reading, free-text answers, AI-evaluated responses, voice input/output, and adaptive follow-ups on errors.

**Scope:** Single-passage proof-of-concept. No auth, no database. Validated by human testing.

---

## Pain Point → Design Decision Map

Every design decision traces back to a specific student complaint. Nothing is arbitrary.

| # | Pain Point | Design Decision | Implementation |
|---|-----------|-----------------|----------------|
| 1 | Passage overwhelming all at once | **Chunked passage display** — passage split into ~5 sections, revealed one at a time | Passage stored as array of chunks. Only current chunk + previously read chunks visible. |
| 2 | Multiple choice is gameable | **Free-text input only** — no multiple choice anywhere | Text input field + mic button (speech-to-text). AI evaluates open-ended responses. |
| 3 | No retention after finishing | **Questions tied to each chunk** — must engage with content to proceed | Questions appear after reading each chunk. Can't skip ahead. Final summary reinforces what was learned. |
| 4 | Wrong-answer feedback is ignored | **Active follow-up loop** — wrong answers trigger a targeted follow-up question, not just an explanation | AI generates a follow-up that re-engages the student with the specific misunderstanding. Student must answer the follow-up. |
| 5 | Feels like a test | **Conversational tone + no time pressure + read-aloud** | Warm AI feedback language. No countdown timers. Read-aloud option makes it feel like storytime, not an exam. Progress shown as learning journey, not score. |
| 6 | Can't navigate back in passage | **All read chunks remain accessible** — scrollable, with section labels | Previously read chunks stay visible (collapsed or scrollable). Current chunk is highlighted. On follow-up, relevant chunk is re-surfaced. |
| 7 | Not adaptive to skill level | **Difficulty selection at start** (Easy / Medium / Hard) | Affects: question complexity, chunk size, feedback verbosity, TTS default speed. |

---

## Screens

### Screen 1: Welcome

**Purpose:** Set the tone (this is learning, not a test) and capture difficulty preference.

| Element | Detail |
|---------|--------|
| Title | Passage title: "The Secret Life of Honeybees" |
| Subtitle | Brief warm intro, e.g. "Let's explore this passage together. Take your time." |
| Difficulty picker | Three options: **Easy** / **Medium** / **Hard** — displayed as friendly labels (e.g. "Take it slow" / "Ready to go" / "Challenge me") |
| Start button | "Let's begin" |

**Difficulty affects:**

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Chunks | ~6 smaller chunks | ~5 chunks | ~4 larger chunks |
| Question depth | Recall + simple inference | Inference + analysis | Analysis + evaluation |
| Feedback verbosity | More supportive, more hints | Balanced | Concise, expects precision |
| TTS default speed | 1x | 1x | 1x |

---

### Screen 2: Reading + Questions (Main Loop)

This is the core experience. It repeats for each chunk.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────┐
│  [Score: 3/4]                    [Chunk 2 of 5] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─ Previously read chunks (collapsed) ───────┐ │
│  │ ▸ Chunk 1: "Inside every beehive..."       │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Current chunk ────────────────────────────┐ │
│  │                                            │ │
│  │  "The worker bees are all female, and      │ │
│  │   they do everything else. Young workers   │ │
│  │   stay inside the hive, cleaning cells..." │ │
│  │                                            │ │
│  │  [🔊 Read Aloud]  [1x ▾ | 1.5x | 2x]     │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Question ─────────────────────────────────┐ │
│  │  "Describe the progression of jobs a       │ │
│  │   worker bee goes through as it ages."     │ │
│  │                                            │ │
│  │  ┌──────────────────────────────┐  [🎤]   │ │
│  │  │ Type or speak your answer... │          │ │
│  │  └──────────────────────────────┘          │ │
│  │                            [Submit]        │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Layout (mobile):** Single column. Same elements stacked vertically. Chunk and question fill the viewport. Previously read chunks accessible via a collapsible "Review previous sections" accordion at top.

**Behaviour per chunk:**

1. Current chunk text appears.
2. Student can read it or tap **Read Aloud** (TTS plays the chunk, with speed controls).
3. After reading, a question appears below the chunk.
4. Student types or speaks (mic button → speech-to-text populates input).
5. Student taps **Submit**.
6. AI evaluates the answer (see Answer Evaluation below).

---

### Answer Evaluation Flow

```
Student submits answer
        │
        ▼
  ┌─ AI evaluates ─┐
  │                 │
  ▼                 ▼
Correct           Incorrect / Partial
  │                 │
  ▼                 ▼
Positive          Targeted feedback +
feedback          follow-up question
  │                 │
  ▼                 ▼
Score +1          Student must answer
Next chunk        follow-up
                    │
                    ▼
              ┌─ AI evaluates ─┐
              │                 │
              ▼                 ▼
           Got it            Still wrong
              │                 │
              ▼                 ▼
           Score +1          Show the answer
           Next chunk        with explanation
                              Score +0
                              Next chunk
```

**Key rules:**
- **Max one follow-up per question.** If they get the follow-up wrong, show the answer gracefully and move on. Never trap the student in a loop.
- **Follow-up re-surfaces the relevant chunk** — the passage section scrolls into view / highlights so the student is guided back to the text.
- **Tone is always encouraging.** Wrong answers get "Not quite — let's look at this part again" not "Incorrect."

---

### Screen 3: Completion

**Purpose:** Reinforce learning, show results, give a sense of accomplishment.

| Element | Detail |
|---------|--------|
| Final score | e.g. "You got 7 out of 9 — nice work!" |
| AI-generated summary | 2–3 sentences: what the student understood well, what they struggled with, one thing to focus on next time. |
| Full passage | The entire passage is now shown (unlocked by completing the journey). Student can re-read freely. |
| Retry button | "Try again" — restarts with fresh AI-generated questions at same difficulty. |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Client (React)                 │
│                                                  │
│  Welcome Screen → Reading Loop → Completion      │
│                                                  │
│  State: chunks[], questions[], answers[],        │
│         score, currentChunk, difficulty           │
│                                                  │
│  Web Speech API (STT) ← mic input               │
│  TTS API ← read aloud                           │
└───────────────┬──────────────────────────────────┘
                │  fetch()
                ▼
┌──────────────────────────────────────────────────┐
│              Next.js API Routes                   │
│                                                  │
│  POST /api/generate-questions                    │
│    → Sends passage + difficulty to Gemini        │
│    → Returns structured question set             │
│                                                  │
│  POST /api/evaluate-answer                       │
│    → Sends question + student answer + passage   │
│      chunk to Gemini                             │
│    → Returns: correct/partial/incorrect,         │
│      feedback text, follow-up question (if any)  │
│                                                  │
│  POST /api/generate-summary                      │
│    → Sends all answers + scores to Gemini        │
│    → Returns final learning summary              │
└───────────────┬──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────┐
│     Gemini 2.0 Flash (Google Generative AI)      │
└──────────────────────────────────────────────────┘
```

**No database. No auth.** All state lives in React. API routes are thin wrappers around Gemini calls.

---

## API Routes

### `POST /api/generate-questions`

**Request:**
```json
{
  "passage": { "id": "passage-1", "title": "...", "content": "..." },
  "difficulty": "easy" | "medium" | "hard"
}
```

**Gemini prompt strategy:**
- System prompt defines the role: "You are generating reading comprehension questions for a student aged 7–15."
- Difficulty level adjusts question depth (recall → inference → analysis).
- Instruct Gemini to return structured JSON: array of `{ chunkIndex, questionText, expectedAnswer, keyConceptsTested }`.
- Passage is pre-chunked on the client; chunk boundaries sent to Gemini so questions map to specific chunks.

**Response:**
```json
{
  "chunks": [
    { "index": 0, "text": "Inside every beehive..." },
    { "index": 1, "text": "The worker bees are all female..." }
  ],
  "questions": [
    {
      "id": "q1",
      "chunkIndex": 0,
      "questionText": "What is the queen bee's main role in the hive?",
      "expectedAnswer": "Her main job is to lay eggs...",
      "keyConceptsTested": ["queen role", "egg laying"]
    }
  ]
}
```

### `POST /api/evaluate-answer`

**Request:**
```json
{
  "questionId": "q1",
  "questionText": "What is the queen bee's main role?",
  "expectedAnswer": "Her main job is to lay eggs...",
  "studentAnswer": "she lays eggs",
  "chunkText": "At the center of the hive is the queen bee...",
  "difficulty": "medium"
}
```

**Gemini prompt strategy:**
- Evaluate whether the student's answer demonstrates understanding of the key concepts.
- Be lenient on spelling/grammar — this is comprehension, not a writing test.
- If incorrect/partial: generate a specific follow-up question that guides the student back to the passage.
- Tone must be warm and encouraging.

**Response:**
```json
{
  "result": "correct" | "partial" | "incorrect",
  "feedback": "That's right — the queen's main job is to lay eggs, up to 2,000 per day!",
  "followUp": null | {
    "questionText": "You mentioned she makes decisions. Look at the passage again — what does it say the queen does NOT do?",
    "hint": "Re-read the sentence starting with 'Despite her title...'"
  }
}
```

### `POST /api/evaluate-followup`

Same shape as `/api/evaluate-answer`, but:
- No further follow-up generated (max depth = 1).
- If still wrong, returns the correct answer with a kind explanation.

**Response:**
```json
{
  "result": "correct" | "incorrect",
  "feedback": "Exactly! Despite her title, the queen doesn't actually make decisions.",
  "correctAnswer": "The queen doesn't make decisions for the hive — her only job is to lay eggs."
}
```

### `POST /api/generate-summary`

**Request:**
```json
{
  "passage": { "title": "...", "content": "..." },
  "difficulty": "medium",
  "results": [
    { "questionId": "q1", "correct": true, "attempts": 1 },
    { "questionId": "q2", "correct": true, "attempts": 2 },
    { "questionId": "q3", "correct": false, "attempts": 2 }
  ]
}
```

**Response:**
```json
{
  "summary": "You did well understanding the hive's social structure and the queen's role. The waggle dance section was tricky — next time, pay close attention to how bees communicate direction and distance. Keep it up!",
  "score": { "correct": 7, "total": 9 }
}
```

---

## Component Structure

```
app/
├── page.tsx                        # Welcome screen
├── session/
│   └── page.tsx                    # Reading + questions loop
├── complete/
│   └── page.tsx                    # Completion screen
├── api/
│   ├── generate-questions/route.ts
│   ├── evaluate-answer/route.ts
│   ├── evaluate-followup/route.ts
│   └── generate-summary/route.ts
├── components/
│   ├── PassageChunk.tsx            # Single chunk display + read aloud controls
│   ├── PreviousChunks.tsx          # Collapsed accordion of read chunks
│   ├── QuestionCard.tsx            # Question display + answer input
│   ├── AnswerInput.tsx             # Text field + mic button (STT)
│   ├── FeedbackCard.tsx            # AI feedback display
│   ├── FollowUpCard.tsx            # Follow-up question on wrong answer
│   ├── ScoreBar.tsx                # Running score indicator
│   ├── DifficultyPicker.tsx        # Easy/Medium/Hard selection
│   ├── ReadAloudButton.tsx         # TTS trigger + speed controls
│   └── CompletionSummary.tsx       # Final score + AI summary
├── lib/
│   ├── gemini.ts                   # Gemini API client wrapper
│   ├── passage.ts                  # Passage data + chunking logic
│   ├── prompts.ts                  # All Gemini prompt templates
│   └── types.ts                    # Shared TypeScript types
└── hooks/
    ├── useSpeechRecognition.ts     # Web Speech API (STT) hook
    └── useTextToSpeech.ts          # TTS API hook with speed controls
```

---

## Text-to-Speech (Read Aloud)

| Aspect | Decision |
|--------|----------|
| Provider | TTS API with natural voice (user to supply API key — e.g. ElevenLabs, Google Cloud TTS, or browser Web Speech API as fallback) |
| Trigger | "Read Aloud" button on each passage chunk |
| Speed controls | 1x (default), 1.5x, 2x — toggle buttons next to play |
| Behaviour | Plays current chunk only. Pause/resume supported. Auto-stops when student moves to next chunk. |

**Note:** If a high-quality TTS key is not available, the browser's built-in `speechSynthesis` API can be used as a zero-cost fallback. Quality varies by browser/OS but is functional.

---

## Speech-to-Text (Voice Input)

| Aspect | Decision |
|--------|----------|
| Provider | Web Speech API (`SpeechRecognition`) — built into Chrome/Edge, free, no API key |
| Trigger | Mic button next to the answer text input |
| Behaviour | Tap mic → recording starts → student speaks → transcript populates the text field → student can edit → submit |
| Fallback | If browser doesn't support Web Speech API, mic button is hidden. Typing always available. |
| Visual feedback | Mic icon pulses/animates while recording. "Listening..." label shown. |

---

## State Management

All client-side. No external storage.

```typescript
type SessionState = {
  difficulty: "easy" | "medium" | "hard";
  passage: Passage;
  chunks: Chunk[];
  questions: Question[];
  currentChunkIndex: number;
  answers: AnswerRecord[];      // { questionId, studentAnswer, result, attempts }
  score: { correct: number; total: number };
  phase: "welcome" | "reading" | "complete";
};
```

State lives in a React context or `useReducer` at the session level. No prop drilling.

---

## What This Does NOT Include (Intentionally)

| Excluded | Reason |
|----------|--------|
| Authentication | Not needed for feature test. Later concern. |
| Database / persistence | Session-only scope. No user accounts. |
| Multiple passages | Single passage for proof-of-concept. |
| Dynamic mid-session difficulty | Simple tier selection is sufficient to demonstrate adaptability. |
| Parent/tutor dashboard | Out of scope for this test. |
| Offline support | Online-only is fine for assessment. |

---

## Validation Plan

After building, the developer (you) will test the full flow as a student:

1. **Select each difficulty level** and verify question depth changes.
2. **Answer correctly** — confirm feedback is warm and score increments.
3. **Answer incorrectly** — confirm follow-up question appears, chunk is re-surfaced, and the loop works.
4. **Answer follow-up incorrectly** — confirm graceful resolution (shows answer, moves on).
5. **Use Read Aloud** at each speed — confirm audio plays, pauses, and speed changes work.
6. **Use Mic Input** — confirm transcript populates field and can be edited.
7. **Complete the session** — confirm final score and AI summary are meaningful.
8. **Test on mobile viewport** — confirm layout is usable on phone-width screen.
9. **Ask yourself:** Does this feel like learning or like a test?
