# NeuroLearn — AI Learning Assistant

A web app that transforms academic content into multiple personalized formats (audio, step-by-step, diagrams, simplified summaries) and adapts to each student's neurodivergent learning preferences over time.

## Core flow

```text
Input  →  AI Transform  →  Output Tabs (Audio | Steps | Diagram | Summary)
                                 ↓
                          Quiz  →  Adaptive Re-explain
                                 ↓
                              Planner
```

## Pages & sections

1. **Landing / Demo** (`/`) — hero, "Try Demo" button that loads a sample paragraph and shows before/after across all formats with a simulated comprehension lift.
2. **Auth** (`/login`, `/signup`) — email + password via Lovable Cloud.
3. **Onboarding** (`/onboarding`) — multi-select preferences chips ("I get overwhelmed by long text", "I prefer listening", "I lose focus easily", "I need step-by-step", "I like predictable structure", etc.). Stored in `user_preferences`.
4. **Workspace** (`/app`) — main hub:
   - **Input panel**: paste text, upload PDF/image (OCR), upload .txt/.md.
   - **Output tabs**: Audio • Steps • Diagram • Summary.
   - **"Explain it differently"** dropdown: Simpler / Step-by-step / Real-world analogy / Visual description.
   - **Adaptation controls** (always visible): Speed, Tone, Detail level, Chunk size — sticky sidebar.
5. **Quiz** (inline after content) — 2–4 AI-generated questions; wrong answers trigger a re-explanation in a different style and log the miss to refine future outputs.
6. **Planner** (`/planner`) — paste an assignment → AI breaks it into steps with time estimates → checkable list → in-app + browser notification reminders. Encouraging copy ("Nice — one step done. Want a 2-min break?").
7. **History** (`/library`) — saved sessions, can replay audio or revisit notes.

## Personalization engine

- Preferences stored as flexible tags (not categories) in `user_preferences.tags jsonb`.
- Each AI call includes a system prompt built from active tags → adjusts sentence complexity, length, repetition, default format.
- Behavior tracking: which formats users open, time spent, quiz accuracy → stored in `interaction_events`. A nightly-style aggregate (computed on read) tweaks default detail level, chunk size, and preferred starting tab.
- "Explain differently" picks become implicit signals (e.g. user repeatedly chooses analogy → analogy becomes default).

## TTS system (browser SpeechSynthesis)

- AI rewrites the source into a **TTS-optimized script** before speaking: short segments, natural pauses (encoded as `...` and SSML-like breaks), inline definitions for hard terms, mini-rephrases, ends with a recap line.
- Player UI: play/pause, segment-by-segment progress, current sentence highlighted, jump to segment, restart segment.
- Controls: Speed (slow 0.8 / med 1.0 / fast 1.25), Tone (calm/neutral/engaging — picks different voice + rate/pitch combos from `speechSynthesis.getVoices()`), Detail (regenerates script), Chunk size (regenerates script).

## Visual diagrams

- AI returns **Mermaid** syntax for flowcharts/concept maps (rendered with `mermaid` package — fast, editable).
- Optional "Generate illustration" button uses Lovable AI image model for a richer visual when structure isn't enough.

## Demo mode

- Pre-baked academic paragraph (e.g. mitochondria or supply & demand).
- Side-by-side: raw text vs. simplified summary, plays sample audio, shows a Mermaid diagram, runs a 2-question quiz, then displays a "comprehension lift" stat card (simulated: 42% → 89%).
- No login required.

## Tech / data (technical section)

- **Stack**: TanStack Start + Lovable Cloud (auth + Postgres) + Lovable AI Gateway (default `google/gemini-3-flash-preview`).
- **AI server functions**: `transformContent`, `generateTTSScript`, `generateMermaid`, `generateQuiz`, `regradeAndReexplain`, `breakDownAssignment`, `extractTextFromImage` (Gemini vision for OCR), `extractTextFromPdf` (pdfjs in browser → server function for summarization).
- **TTS**: browser `SpeechSynthesis` API entirely client-side. Voice picker maps tones to available system voices.
- **Diagrams**: `mermaid` npm package, client-rendered.
- **Notifications**: browser Notification API + in-app toast; reminder times stored in `planner_reminders`, checked via `setInterval` while app is open.
- **Tables**: `profiles`, `user_preferences (tags jsonb, controls jsonb)`, `sessions (input, outputs jsonb)`, `interaction_events`, `quiz_results`, `assignments`, `assignment_steps`, `planner_reminders`. RLS: each user reads/writes only their own rows.

## Design

- Calm, low-stimulation: soft neutral background, generous spacing, max content width ~720px, rounded cards, single accent color (soft teal). Sans-serif (Inter). Reduced-motion respected. Dyslexia-friendly font toggle in settings.
- Icons via lucide-react. Chunked text blocks with clear headings, never walls of text.

## Out of scope (v1)

- Email/SMS reminders (in-app + browser only, per your choice).
- Native mobile app.
- Real-time collaboration.
