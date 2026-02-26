# Development Plan

Iterative, commit-per-milestone approach. Each phase is a working state that can be tested.

---

## Phase 0: Scaffold ← START HERE

**Commit:** `chore: project scaffold`

- Initialize Next.js 14+ (App Router, TypeScript, Tailwind)
- Set up project structure (pages, api routes, components, lib, hooks — all empty/placeholder)
- Verify `npm run dev` works with a hello-world page
- Confirm `.env.local` loads (log key prefix on server start)

**Test:** App runs at localhost:3000.

---

## Phase 1: Passage Data + Chunking

**Commit:** `feat: passage data and chunking logic`

- Add passage JSON to `lib/passage.ts`
- Write chunking function — splits passage into sections by logical breaks
- Difficulty level determines chunk count (Easy ~6, Medium ~5, Hard ~4)
- Unit: export typed `Chunk[]` given a difficulty

**Test:** Import and log chunks at each difficulty.

---

## Phase 2: Welcome Screen

**Commit:** `feat: welcome screen with difficulty picker`

- Build `page.tsx` — title, subtitle, difficulty picker (Easy/Medium/Hard)
- Store selected difficulty in URL param or context
- Navigate to `/session` on start
- Responsive layout (mobile + desktop)

**Test:** Select difficulty → lands on /session with difficulty param.

---

## Phase 3: Gemini Integration + Question Generation

**Commit:** `feat: AI question generation via Gemini`

- Build `lib/gemini.ts` — Gemini client wrapper
- Build `lib/prompts.ts` — question generation prompt template
- Build `api/generate-questions/route.ts`
- Accepts passage + difficulty → returns structured questions mapped to chunks
- Define types in `lib/types.ts`

**Test:** Hit the API route manually → get valid JSON questions back.

---

## Phase 4: Reading Loop (Core UX)

**Commit:** `feat: chunked reading with questions`

- Build session page state machine (`welcome → reading → complete`)
- `PassageChunk` component — shows current chunk text
- `PreviousChunks` component — accordion of already-read chunks
- `QuestionCard` + `AnswerInput` — text input for answers
- `ScoreBar` — running score display
- Wire up: load questions on session start → show chunk → show question → submit answer
- No AI evaluation yet — just the UI flow with placeholder feedback

**Test:** Can read through all chunks, type answers, see placeholder feedback, see score bar.

---

## Phase 5: AI Answer Evaluation

**Commit:** `feat: AI answer evaluation with feedback`

- Build `api/evaluate-answer/route.ts`
- Build `FeedbackCard` component — shows AI feedback after submission
- Wire submit → API call → display result (correct/partial/incorrect + feedback text)
- Correct → score +1, advance to next chunk
- Incorrect → show feedback (follow-up not wired yet)

**Test:** Type correct answer → green feedback. Type wrong answer → helpful feedback.

---

## Phase 6: Follow-Up Loop on Errors

**Commit:** `feat: follow-up questions on wrong answers`

- Build `api/evaluate-followup/route.ts`
- Build `FollowUpCard` component
- On incorrect/partial: show follow-up question + re-surface relevant chunk
- Student answers follow-up → evaluate → resolve (correct or show answer)
- Max one follow-up per question

**Test:** Answer wrong → follow-up appears → answer follow-up → moves on.

---

## Phase 7: Completion Screen + Summary

**Commit:** `feat: completion screen with AI summary`

- Build `api/generate-summary/route.ts`
- Build `complete/page.tsx` with `CompletionSummary` component
- Final score, AI-generated learning summary, full passage reveal, retry button

**Test:** Complete a session → see score + meaningful summary.

---

## Phase 8: Text-to-Speech (Read Aloud)

**Commit:** `feat: passage read-aloud with speed controls`

- Build `hooks/useTextToSpeech.ts`
- Build `ReadAloudButton` component — play/pause + 1x/1.5x/2x
- Try ElevenLabs API first (if key present), fall back to browser `speechSynthesis`
- Wire into `PassageChunk`

**Test:** Tap read aloud → hear passage chunk. Change speed → audible difference.

---

## Phase 9: Speech-to-Text (Voice Input)

**Commit:** `feat: voice input for answers`

- Build `hooks/useSpeechRecognition.ts` (Web Speech API)
- Add mic button to `AnswerInput`
- Tap mic → speak → text populates input → student edits → submits
- Hide mic button if browser doesn't support it

**Test:** Tap mic → speak → see transcript in input field.

---

## Phase 10: Polish + Mobile

**Commit:** `feat: responsive polish and UX refinements`

- Test full flow on mobile viewport
- Tweak spacing, font sizes, touch targets
- Loading states on AI calls (skeleton/spinner)
- Error states if Gemini fails
- Warm, non-robotic copy throughout

**Test:** Full flow on phone-width. No broken layouts. No silent failures.

---

## Phase 11: Deploy

**Commit:** `chore: deploy to Vercel`

- Push to GitHub
- Connect to Vercel
- Set env vars in Vercel dashboard
- Verify live link works

**Test:** Live URL loads and full flow works.

---

## Summary

| Phase | What | Key Risk |
|-------|------|----------|
| 0 | Scaffold | None |
| 1 | Passage + chunking | Chunk boundary quality |
| 2 | Welcome screen | None |
| 3 | Gemini + questions | Prompt quality, response format |
| 4 | Reading loop UI | State management complexity |
| 5 | Answer evaluation | AI leniency tuning |
| 6 | Follow-up loop | UX flow on errors |
| 7 | Completion screen | Summary quality |
| 8 | TTS | ElevenLabs integration / fallback |
| 9 | STT | Browser compatibility |
| 10 | Polish | Mobile edge cases |
| 11 | Deploy | Env vars on Vercel |
