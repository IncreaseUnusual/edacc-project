# Product Constraints

Known constraints derived from the existing EdAccelerator service model and the new feature specification (AI Reading Comprehension Interface).

---

## Audience Constraints

| Constraint         | Value                  |
|--------------------|------------------------|
| Age range          | 7–15 years old         |
| Year levels        | Year 1–10              |
| Subject            | English only           |
| Primary user       | Student                |
| Decision maker     | Parent/guardian         |

---

## Delivery Constraints (Company-Wide)

- **Format:** Online only (Zoom-based currently for live sessions).
- **Session types:** 1-on-1 and group sessions.
- **Frequency:** Minimum two lessons per week (required for guarantee eligibility).
- **Guarantee period:** 3 months — student must attend consistently.

---

## Pedagogical Constraints

The program must cover four skill domains:

1. **Writing** — essay/story/report structure, clarity, creativity.
2. **Reading** — comprehension, analysis, themes, tone, author intent, unseen texts.
3. **Language conventions** — grammar, punctuation, vocabulary, spelling, sentence structure.
4. **Motivation** — study habits, engagement, focus, confidence building.

---

## Operational Constraints

- Teaching team is human (named tutors); any app must **support** — not replace — tutor interaction.
- Student work requires **individual review and feedback** (not auto-graded only).
- Resources and content already exist (videos, practice exams, workbooks) — app should integrate or complement them.
- Onboarding involves a **1-on-1 call** with the team to assess fit; this is a sales and qualification step.

---

## Business Constraints

- Revenue model is subscription/program-based (not per-session).
- 3-month guarantee is a core sales mechanism — any product must account for tracking attendance and grade outcomes.
- Reviews and social proof (213+ reviews, 4.9/5) are central to trust — surface them in any user-facing product.
- Free resources exist as a lead-generation funnel.

---

## Technical Constraints: AI Reading Comprehension Feature (from spec)

These are **hard constraints** from the feature specification. Non-negotiable.

| Constraint      | Value                                          |
|-----------------|------------------------------------------------|
| Framework       | Next.js 14+ (App Router)                       |
| Language        | TypeScript                                     |
| Styling         | Tailwind CSS                                   |
| AI Provider     | Gemini 2.0 Flash (Google Generative AI API)    |
| Deployment      | Vercel (must be publicly accessible)           |
| Platforms       | Mobile and desktop (responsive)                |

---

## Resolved Scope Decisions

| Question | Decision |
|----------|----------|
| Standalone or embedded? | **Standalone** Next.js app. No existing platform to integrate with. |
| Authentication? | **None.** Focus is on the learning experience, not user management. Auth is a later concern. |
| How many passages? | **One** ("The Secret Life of Honeybees"). This is a feature test, not a production deployment. |
| Persistence? | **Session only.** No database. Running score + final score in client state. |
| Score tracking? | **Running score** visible during the session + **final score** at completion. No external storage. |
| Adaptive difficulty? | **Simple.** Difficulty tier selected at session start (e.g. easy/medium/hard). No mid-session adjustment. |
| Scope? | **Assessment / proof-of-concept.** Demonstrate good principles and solve the UX problem. Not production integration. |
| Validation method? | **Human testing.** The builder will test the experience as a student and validate whether it solves the pain points. |
| Cost sensitivity? | **Not a concern** for this test. Experience quality is the priority. |

---

## Feature Requirements (from spec)

### Must Have

- Display reading passages with AI-generated questions.
- AI generates high-quality comprehension questions (genuine understanding, not surface recall).
- Support different question types and difficulty levels.
- Track correct and incorrect answers.
- Show a final score at completion.
- Responsive design — mobile and desktop.

### Text-to-Speech (Passage Read-Aloud)

- Each passage chunk must have a **read aloud** button.
- Voice must sound **natural** (not robotic) — use a high-quality TTS API (e.g. ElevenLabs, Google Cloud TTS, or similar).
- Must support **playback speed controls**: 1x (default), 1.5x, 2x.
- User can pause/resume.

### Speech-to-Text (Voice Input for Answers)

- Students can **tap a mic button** to speak their answer instead of typing.
- Browser Speech Recognition API (Web Speech API) for STT — free, no key needed, works in Chrome/Edge.
- Transcribed text populates the answer input field; student can edit before submitting.
- Typing remains available as a fallback.

### AI Question Generation

- Questions must be generated using AI (Gemini 2.0 Flash).
- Generation can happen at build time, on-demand, or hybrid.
- Question quality must drive strong learning outcomes.

### Mock Data

A single passage ("The Secret Life of Honeybees") is provided for initial development. Questions must be AI-generated from this passage — not hand-written.

---

## User Feedback Constraints (from spec)

These represent design requirements derived from student complaints about the current tool:

| Feedback | Design Constraint |
|----------|-------------------|
| Passage overwhelming all at once | Must chunk or progressively reveal the passage. Passage length cannot be shortened. |
| Multiple choice is gameable | Must include typed/free-text answer input. |
| No retention after finishing | Must create a reason to deeply understand — not just answer correctly. |
| Wrong-answer feedback is passive | Must actively engage student with errors (not just show explanation). |
| Feels like a test | UX must feel like learning, not assessment. |
| Can't navigate back in passage | Must allow easy re-reading / passage navigation. |
| Not adaptive to skill level | Must adapt interface to different ages and reading speeds. |
