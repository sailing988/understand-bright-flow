# NeuroLearn v2 — Adaptive Learning Ecosystem

Big scope. I'll ship this in 4 phases so you see progress fast. Each phase is self-contained and you can pause/redirect between them.

## Phase 1 — Visual System, Theming, Dashboard
**Goal:** colorful, animated, accessible UI with light/dark + theme picker, plus a new analytics dashboard.

- Extend `src/styles.css` with: gradient tokens (calm/sunset/forest/lavender), glow shadows, animated background blobs, keyframes (`fade-in`, `slide-up`, `scale-in`, `float`, `shimmer`, `pulse-glow`, `gradient-shift`), `.hover-lift`, `story-link`. Respect `prefers-reduced-motion`.
- `useTheme` hook + `<ThemeMenu />` in the AppShell:
  - Light / Dark / System.
  - 4 accent themes (Teal, Sunset, Lavender, Forest) — applied by toggling a class on `<html>` and swapping `--primary`/`--accent`/`--ring`.
  - Dyslexia-font and "reduce motion" toggles live here too.
- Reworked AppShell: glass nav, animated gradient backdrop, floating icon accents, XP/streak chips, mobile drawer nav.
- New **/dashboard** route: study time, formats used (bar chart), quiz performance over time (line chart), strengths/weaknesses, assignment completion stats, personalized recommendations. Charts via `recharts` (already in shadcn stack).
- All existing pages (Home, Workspace, Planner, Library, Login, Signup, Onboarding, Preferences) get the new animated cards, gradient buttons, progress bars, and responsive polish (grid + `min-w-0` rules).

## Phase 2 — Gamification, Advanced Preferences, Adaptation
**Goal:** XP, streaks, badges, daily/weekly goals + a smarter personalization engine.

### DB
- `gamification (user_id pk, xp int, level int, streak_days int, last_active_on date, daily_goal_minutes int default 20, weekly_goal_sessions int default 5, badges jsonb default '[]')`
- Extend `user_preferences.controls` with: `complexity` (simple|standard|advanced), `visualSupport` (low|med|high), `reviewFrequency` (low|med|high), `pacing` (slow|med|fast), `length` (concise|standard|detailed). Tags become multi-select (already are — just richer list).
- New `behavior_signals` view (server-side aggregate of `interaction_events` + `quiz_results`) used by an `adaptPreferences` server fn that nudges controls based on history (e.g. low quiz scores → bump visualSupport & reviewFrequency, long sessions → smaller chunks).

### UI
- Header: animated XP bar, level pill, flame streak.
- Workspace quiz: progress bar, animated correct/incorrect, confetti on perfect, XP toast.
- Planner: animated radial progress per assignment, milestone celebration.
- New **/goals** card on Dashboard: daily/weekly goal rings, badge gallery, encouragement messages.
- Preferences page gets a multi-select tag cloud + all new sliders/segmented controls; "Let AI adapt for me" toggle that calls `adaptPreferences` after each session.

## Phase 3 — Resources Library
**Goal:** searchable, filterable, bookmarkable, personalized resources tab.

- Route `src/routes/resources.tsx` + nav entry.
- Curated dataset (`src/data/resources.ts`, ~50 items) across the categories you listed (Study Skills, Learning Strategies, Time Management, Organization, Executive Function, Memory, Note-Taking, Test-Taking, Focus & Productivity, Accessibility Tools, AI Learning Tools). Each: title, summary, url, type (article/video/tool/technique), category, tags, recommendedFor[] (matches preference tags).
- Features: top search bar, category chip filter, type filter, "Bookmarked" toggle, animated cards with hover lift.
- "Recommended for you" rail ranks by tag overlap with `user_preferences.tags` + recent struggle signals (low quiz → focus/memory items first).
- DB: `bookmarks(user_id, resource_id text, created_at)` + RLS + GRANTs. Heart toggle, persisted.

## Phase 4 — Notebooks (NotebookLM-style) + Smart AI
**Goal:** source-grounded study workspace per topic.

### DB (all RLS `auth.uid() = user_id` + GRANTs)
- `notebooks (id, user_id, title, description, created_at)`
- `notebook_sources (id, notebook_id, user_id, kind: pdf|text|image|url, title, content_text, char_count, created_at)`
- `notebook_chats (id, notebook_id, user_id, role, content, citations jsonb, created_at)`
- `notebook_artifacts (id, notebook_id, user_id, kind: study_guide|flashcards|quiz|timeline|concepts|vocab|audio_script, payload jsonb, created_at)`

### Routes
- `/notebooks` — grid of notebooks, create new.
- `/notebooks/$notebookId` — three-pane workspace:

```text
┌──────────┬────────────────────────┬──────────┐
│ Sources  │ Chat w/ [S1] citations │ Studio   │
│  + add   │                        │  Guide   │
│  + OCR   │                        │  Cards   │
│  + PDF   │                        │  Quiz    │
│          │                        │  Timeline│
│          │                        │  Concepts│
│          │                        │  Vocab   │
│          │                        │  Audio   │
└──────────┴────────────────────────┴──────────┘
```

### Server functions (all `requireSupabaseAuth`)
- `chatNotebook` — system prompt pins AI to numbered source snippets; instructs `[S<n>]` citations; UI renders clickable citation chips that open the source.
- `generateStudyGuide`, `generateFlashcards`, `generateNotebookQuiz`, `generateTimeline`, `generateConceptSummaries`, `generateVocab` — structured JSON output, each item carries `sourceRefs[]`.
- `generateAudioStudy` — produces a 2-host podcast-style script. Reused browser TTS hook plays it with alternating voices ("Audio Study Mode"). Also a single-narrator "audio summary" variant.
- `detectConfusingSections` — flags hard passages in a source; one-click "simplify" via existing `explainDifferently`.
- `suggestStudyPlan` — given a deadline + notebook, drafts a phased plan and inserts `assignments` + `assignment_steps` rows with `remind_at`.

### Ingestion
- Paste text, OCR image (existing), PDF via `pdfjs-dist` parsed in-browser (Worker-friendly) before upload.

## Technical Notes
- Stack unchanged: TanStack Start + Lovable Cloud + Lovable AI Gateway (`google/gemini-3-flash-preview` default; `gemini-2.5-pro` for long-source studio generations).
- Charts: `recharts` (shadcn primitive).
- All new tables follow the public-grant pattern (`GRANT … TO authenticated; GRANT ALL TO service_role`).
- Theming uses `<html>` class swap so SSR and persistence are simple.
- Animations gated by `prefers-reduced-motion` + user toggle.

## Out of scope (calling out)
- Real server-side podcast audio rendering (we use browser TTS with two voices).
- Native push notifications (browser Notifications API remains).
- Collaborative/shared notebooks.

## Delivery order
1. Phase 1 (visual + dashboard) — biggest perceived change.
2. Phase 2 (gamification + adaptive prefs).
3. Phase 3 (Resources).
4. Phase 4 (Notebooks + smart AI) — largest, ships last.

Approve and I'll start on Phase 1.
