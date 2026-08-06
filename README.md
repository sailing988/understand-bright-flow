# NeuroLearn

An AI-powered learning assistant designed for **neurodivergent students**. NeuroLearn transforms academic content into multiple accessible formats — audio narration, step-by-step breakdowns, visual diagrams, plain-language summaries, and quizzes — and continuously adapts to each student's learning preferences.

---

## Table of Contents

- [What is NeuroLearn?](#what-is-neurolearn)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [AI Integrations](#ai-integrations)
- [Database Schema](#database-schema)
- [MCP / Agent Integration](#mcp--agent-integration)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What is NeuroLearn?

Traditional study tools are one-size-fits-all. NeuroLearn starts from the idea that every brain learns differently — especially neurodivergent learners who may struggle with focus, executive function, time estimation, test anxiety, or long blocks of text.

Students tell NeuroLearn **how they learn and what they struggle with**, then paste, upload, or photograph any academic content. The app generates a personalized set of study materials and adapts future outputs based on behavior and performance.

---

## Features

### Core Learning Workspace
- **Multi-format content transformation** — turn any source text into:
  - Plain-language summary
  - Step-by-step chunked explanation
  - Visual Mermaid diagram / concept map
  - Conversational audio script
  - Auto-generated quiz with explanations
- **Multi-source input** — paste text, upload PDFs, Word documents, images, markdown, CSV, or plain text files.
- **"Explain it differently"** — re-explain any concept in a simpler, stepwise, analogy, or visual style.
- **Text-to-speech (TTS)** — built-in browser speech synthesis with pauses, inline definitions, and a recap segment.

### Personalization
- **Learning profile onboarding** — choose from 12 profiles such as *Easily Distracted*, *Visual Learner*, *Time Blind*, *Test Anxiety*, *Hyperfocus*, and more.
- **AI-generated study strategy** — a single cohesive plan that blends all selected profiles together instead of treating them independently.
- **Adaptive preferences** — controls for detail level, chunk size, tone, pacing, visual support, and review frequency.

### Planning & Library
- **Assignment planner** — break assignments into small, time-bounded steps.
- **Library** — save transformed sessions and revisit them later.
- **Resources** — curated, searchable, bookmarkable learning resources across study skills, executive function, memory, focus, and accessibility.

### Gamification & Analytics
- **XP, levels, streaks, and badges** — lightweight motivation layer.
- **Analytics dashboard** — study time, formats used, quiz performance, strengths/weaknesses, and personalized recommendations.

### Agent Integration (MCP)
- Exposes a **Model Context Protocol (MCP)** server at `/mcp` so ChatGPT, Claude, Cursor, and other MCP clients can:
  - List and create planner assignments
  - List the user's saved library
  - Transform content into accessible formats
- OAuth-protected so the agent acts as the authenticated user.

### Notebook-Style Study (Planned)
- Source-grounded knowledge notebooks
- Chat with citations to uploaded sources
- Auto-generated study guides, flashcards, timelines, vocab lists, and audio scripts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | TanStack Start v1 (React 19, file-based routing, SSR/SSG) |
| **Build Tool** | Vite 7 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui primitives |
| **UI Components** | Radix UI primitives + custom components |
| **Charts** | Recharts |
| **Diagrams** | Mermaid.js |
| **Backend** | Lovable Cloud (Supabase) — Auth + Postgres |
| **AI Gateway** | Lovable AI Gateway (`google/gemini-3-flash-preview`, `gemini-2.5-flash`, `gemini-2.5-pro`) |
| **Auth** | Supabase Auth + Google OAuth via `@lovable.dev/cloud-auth-js` |
| **Agent Protocol** | Model Context Protocol via `@lovable.dev/mcp-js` |
| **PDF Parsing** | pdfjs-dist |
| **Word Parsing** | mammoth |
| **Validation** | Zod |
| **Deployment** | Cloudflare Workers (TanStack Start edge target) |

---

## Project Structure

```text
src/
├── components/          # Shared UI components, AppShell, DemoPanel, MermaidView
├── hooks/               # Custom hooks: auth, preferences, TTS, mobile
├── integrations/        # Lovable Cloud + Supabase clients and auth middleware
├── lib/                 # Server functions, MCP tools, learning profiles
│   ├── ai.functions.ts  # AI gateway calls (transform, quiz, TTS, OCR, strategy)
│   └── mcp/             # MCP tool definitions
├── routes/              # TanStack Start file routes
│   ├── index.tsx        # Landing page
│   ├── app.tsx          # Main workspace
│   ├── planner.tsx      # Assignment planner
│   ├── library.tsx      # Saved sessions
│   ├── onboarding.tsx   # Learning profile picker
│   ├── study-strategy.tsx # AI-generated strategy
│   ├── login.tsx / signup.tsx
│   └── ...
├── styles.css           # Tailwind v4 theme + custom tokens
└── types/               # TypeScript shims
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) or Node.js 20+
- A Lovable Cloud project with Supabase enabled

### Install dependencies

```bash
bun install
```

### Run the dev server

```bash
bun dev
```

The app will be available at `http://localhost:8080`.

### Build for production

```bash
bun build
```

---

## Environment Variables

The Lovable Cloud integration auto-generates these in `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
LOVABLE_API_KEY=...
```

Do not commit `.env` to version control. The `LOVABLE_API_KEY` is server-only and used for AI gateway calls.

---

## Authentication

NeuroLearn uses **Supabase Auth** with **Google OAuth**.

- New users are routed through onboarding after sign-up.
- Returning users land in the workspace.
- Row-level security (RLS) ensures users only see their own data.

---

## AI Integrations

All AI calls go through the **Lovable AI Gateway**:

| Server Function | Purpose |
|-----------------|---------|
| `transformContent` | Generate summary, steps, diagram, and title from input text |
| `generateTTSScript` | Create conversational audio scripts with natural pacing |
| `explainDifferently` | Re-explain content in simpler / stepwise / analogy / visual styles |
| `generateQuiz` | Create 3-question multiple-choice quizzes |
| `breakDownAssignment` | Split assignments into manageable steps |
| `generateStudyStrategy` | Build a cohesive study plan from multiple learning profiles |
| `extractTextFromImage` | OCR for uploaded images |

The default model is `google/gemini-3-flash-preview`. Vision/OCR and long-form generation use `gemini-2.5-flash` and `gemini-2.5-pro`.

---

## Database Schema

Lovable Cloud (Supabase Postgres) tables include:

- `profiles` — user display name and metadata
- `user_preferences` — selected learning profiles, tags, and adaptive controls
- `sessions` — saved learning sessions and generated outputs
- `quiz_results` — quiz attempts and scores
- `interaction_events` — behavior signals for adaptation
- `assignments` / `assignment_steps` — planner tasks and sub-steps
- `gamification` — XP, level, streak, badges, goals
- `resources` — curated learning resource catalog
- `bookmarks` — user resource bookmarks
- `notebooks` / `notebook_sources` / `notebook_chats` / `notebook_artifacts` — source-grounded notebooks (Phase 4)

All user-facing tables have **RLS enabled** and `GRANT` statements for `authenticated` and `service_role` roles.

---

## MCP / Agent Integration

NeuroLearn exposes an MCP server at `/mcp` with OAuth issuer authentication.

Available tools:

- `list_assignments` — list the user's planner assignments
- `create_assignment` — create a new assignment with steps
- `list_library` — list saved learning sessions
- `transform_content` — transform text into NeuroLearn formats

To use it, connect an MCP client to:

```text
https://<your-domain>/mcp
```

The OAuth consent flow ensures the agent can only access data for the signed-in user.

---

## Roadmap

1. **Phase 1 — Visual System & Dashboard** ✅
   - Animated themes, light/dark mode, color palettes, analytics dashboard
2. **Phase 2 — Gamification & Advanced Personalization** ✅
   - XP/streaks/badges, adaptive preference engine, goals page
3. **Phase 3 — Resources Library** ✅
   - Searchable, filterable, bookmarkable resources
4. **Phase 4 — NotebookLM-Style Knowledge Base** 🚧
   - Source notebooks, cited chat, study artifacts, audio study mode

---

## Contributing

This project is maintained in Lovable. If you want to extend it:

1. Keep new routes in `src/routes/` using TanStack Start conventions.
2. Add AI calls in `src/lib/ai.functions.ts` via `createServerFn`.
3. New database tables must include RLS policies and `GRANT` statements.
4. Don't hardcode colors — use the Tailwind theme tokens in `src/styles.css`.

---

## License

MIT — see `LICENSE` if included.

---

Built with ❤️ for neurodivergent learners using **Lovable**, **TanStack Start**, **Supabase**, and **Gemini**.
