# Output Inspector panel

Add a developer-style "Output Inspector" to the Workspace so you can see the exact JSON each AI pipeline step returned, before the UI turns it into tabs, audio players, checklists and diagrams.

## What you get

- A collapsible **Output Inspector** section below the results area on the Workspace page.
- One entry per pipeline step, in the order it ran:
  - `transformContent` (title, summary, steps, mermaid)
  - `generateTTSScript` (segments)
  - `generateQuiz` (questions)
  - `explainDifferently` (explanation)
  - `extractTextFromImage` (OCR text), when an image was used
- Each entry shows: step name, status (pending / ok / error), duration in ms, payload size, and the pretty-printed raw JSON in a monospace scrollable block.
- Per-step **Copy JSON** button, plus **Copy all** and **Clear** for the whole log.
- Errors are captured too: failed steps show the error message instead of a payload, so you can see when a step returned nothing or malformed JSON.
- Hidden by default behind a small "Output Inspector" toggle so it never gets in the way of normal studying.

## Technical notes

- New component `src/components/OutputInspector.tsx`: presentational only, takes a list of step records and renders collapsible cards (shadcn `Card` + `Collapsible`, `JSON.stringify(payload, null, 2)`).
- New hook `src/hooks/use-inspector.ts` holding an in-memory array of records: `{ id, step, status, startedAt, durationMs, payload?, error? }`, with `start(step)` / `succeed(id, payload)` / `fail(id, error)` / `clear()`.
- `src/routes/app.tsx` wires the hook into the existing handlers (`handleTransform`, `regenerateScript`, `handleQuiz`, `handleReexplain`, OCR upload) by recording around each `useServerFn` call. Rendering logic and existing state stay unchanged.
- The existing **Clean content** button also clears the inspector log.
- No changes to `src/lib/ai.functions.ts`, no database writes, no new dependencies — the log lives only in the current browser session.
