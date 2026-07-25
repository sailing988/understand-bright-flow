import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

async function callAI(opts: {
  system: string;
  user: string;
  tools?: any[];
  toolChoice?: any;
  model?: string;
}) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: opts.model || DEFAULT_MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.tools) {
    body.tools = opts.tools;
    body.tool_choice = opts.toolChoice;
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited. Please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    const text = await res.text();
    console.error("AI gateway error", res.status, text);
    throw new Error("AI service error");
  }
  return res.json();
}

function preferenceContext(prefs: { tags?: string[]; controls?: any } | undefined) {
  if (!prefs) return "";
  const tags = prefs.tags || [];
  const c = prefs.controls || {};
  const lines: string[] = [];
  if (tags.length) lines.push(`User preferences/challenges: ${tags.join("; ")}.`);
  if (c.detail) lines.push(`Detail level: ${c.detail}.`);
  if (c.chunkSize) lines.push(`Chunk size: ${c.chunkSize}.`);
  if (c.tone) lines.push(`Tone: ${c.tone}, supportive.`);
  if (tags.includes("I get overwhelmed by long text")) lines.push("Keep paragraphs to 1-2 sentences.");
  if (tags.includes("I lose focus easily")) lines.push("Use bold key phrases and short bursts.");
  if (tags.includes("I need step-by-step instructions")) lines.push("Prefer numbered steps.");
  return lines.join(" ");
}

const TransformInput = z.object({
  text: z.string().min(10).max(20000),
  preferences: z.object({ tags: z.array(z.string()).optional(), controls: z.any().optional() }).optional(),
});

export const transformContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TransformInput.parse(d))
  .handler(async ({ data }) => {
    const ctx = preferenceContext(data.preferences);
    const tool = {
      type: "function",
      function: {
        name: "deliver_outputs",
        description: "Return all four learning outputs.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short topic title (max 8 words)" },
            summary: { type: "string", description: "Plain-language summary, 2-3 short paragraphs" },
            steps: {
              type: "array",
              items: { type: "object", properties: { heading: { type: "string" }, body: { type: "string" } }, required: ["heading", "body"] },
              description: "4-7 chunked step-by-step explanations",
            },
            mermaid: { type: "string", description: "Valid Mermaid flowchart or mindmap syntax (start with 'flowchart TD' or 'mindmap')" },
          },
          required: ["title", "summary", "steps", "mermaid"],
        },
      },
    };
    const res = await callAI({
      system: `You convert academic content into multiple accessible learning formats for neurodivergent students. Use plain language, define hard terms inline. ${ctx}`,
      user: `Transform this content into all four formats:\n\n${data.text}`,
      tools: [tool],
      toolChoice: { type: "function", function: { name: "deliver_outputs" } },
    });
    const args = res.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return JSON.parse(args || "{}");
  });

const ScriptInput = z.object({
  text: z.string().min(5).max(20000),
  preferences: z.object({ tags: z.array(z.string()).optional(), controls: z.any().optional() }).optional(),
});

export const generateTTSScript = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScriptInput.parse(d))
  .handler(async ({ data }) => {
    const ctx = preferenceContext(data.preferences);
    const tone = data.preferences?.controls?.tone || "calm";
    const chunk = data.preferences?.controls?.chunkSize || "short";
    const detail = data.preferences?.controls?.detail || "standard";
    const tool = {
      type: "function",
      function: {
        name: "deliver_script",
        parameters: {
          type: "object",
          properties: {
            segments: {
              type: "array",
              items: { type: "string", description: "One short spoken segment, ending with natural punctuation." },
              description: "Spoken segments. End with a recap segment.",
            },
          },
          required: ["segments"],
        },
      },
    };
    const res = await callAI({
      system: `Rewrite content into a spoken script for a ${tone}, supportive AI tutor. Rules:
- Conversational, warm, encouraging.
- ${chunk === "very short" ? "8-15" : chunk === "short" ? "15-25" : "25-40"} words per segment.
- Define hard terms immediately ("which means...").
- Reinforce key ideas with quick rephrasing or analogies.
- End with a 1-segment recap starting with "Quick recap:".
- Detail level: ${detail}.
${ctx}`,
      user: `Create the spoken script for:\n\n${data.text}`,
      tools: [tool],
      toolChoice: { type: "function", function: { name: "deliver_script" } },
    });
    const args = res.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return JSON.parse(args || '{"segments":[]}');
  });

const ReexplainInput = z.object({
  text: z.string().min(5).max(20000),
  style: z.enum(["simpler", "stepwise", "analogy", "visual"]),
  preferences: z.object({ tags: z.array(z.string()).optional(), controls: z.any().optional() }).optional(),
});

export const explainDifferently = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ReexplainInput.parse(d))
  .handler(async ({ data }) => {
    const ctx = preferenceContext(data.preferences);
    const styleMap = {
      simpler: "Explain in the simplest possible language a 12-year-old would understand. Short sentences.",
      stepwise: "Break into clearly numbered logical steps. One idea per step.",
      analogy: "Use a vivid real-world analogy throughout the explanation.",
      visual: "Describe it visually as if narrating a diagram or scene the reader can picture.",
    };
    const res = await callAI({
      system: `${styleMap[data.style]} ${ctx}`,
      user: `Re-explain this:\n\n${data.text}`,
    });
    return { explanation: res.choices?.[0]?.message?.content || "" };
  });

const QuizInput = z.object({
  text: z.string().min(10).max(20000),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => QuizInput.parse(d))
  .handler(async ({ data }) => {
    const tool = {
      type: "function",
      function: {
        name: "deliver_quiz",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctIndex: { type: "integer" },
                  explanation: { type: "string" },
                },
                required: ["question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      },
    };
    const res = await callAI({
      system: "Create a 3-question multiple-choice quiz to check understanding. Each question has 4 options. Encouraging tone.",
      user: `Source:\n${data.text}`,
      tools: [tool],
      toolChoice: { type: "function", function: { name: "deliver_quiz" } },
    });
    const args = res.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return JSON.parse(args || '{"questions":[]}');
  });

const PlanInput = z.object({
  assignment: z.string().min(5).max(5000),
});

export const breakDownAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data }) => {
    const tool = {
      type: "function",
      function: {
        name: "deliver_plan",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  estimateMinutes: { type: "integer" },
                },
                required: ["title", "estimateMinutes"],
              },
            },
          },
          required: ["title", "steps"],
        },
      },
    };
    const res = await callAI({
      system: "Break assignments into small, manageable, encouraging steps for a neurodivergent student. 4-8 steps. Each step is one concrete action under 25 minutes.",
      user: data.assignment,
      tools: [tool],
      toolChoice: { type: "function", function: { name: "deliver_plan" } },
    });
    const args = res.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return JSON.parse(args || '{"title":"","steps":[]}');
  });

const OcrInput = z.object({
  imageDataUrl: z.string().startsWith("data:"),
});

export const extractTextFromImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => OcrInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract all readable text from the image. Return only the text, nothing else." },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the text:" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limited.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error("OCR failed");
    }
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content || "" };
  });

const StrategyInput = z.object({
  profiles: z.array(z.string()).min(1).max(20),
});

export const generateStudyStrategy = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StrategyInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are an expert learning coach for neurodivergent students. Given a set of learning profiles the student self-identifies with, produce ONE COHESIVE, integrated study strategy that blends all selected profiles together — never treat them independently. Be warm, concrete, and evidence-based. Reference specific profile combinations when relevant.`;
    const tool = {
      type: "function",
      function: {
        name: "deliver_strategy",
        description: "Deliver a personalized combined study strategy.",
        parameters: {
          type: "object",
          properties: {
            headline: { type: "string", description: "One-sentence personalized headline for this learner." },
            overview: { type: "string", description: "2-3 short paragraphs explaining how these profiles combine and why the plan is shaped this way." },
            why_it_matters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  profile: { type: "string" },
                  explanation: { type: "string", description: "Why this profile matters, 2-3 sentences." },
                },
                required: ["profile", "explanation"],
              },
            },
            study_tips: { type: "array", items: { type: "string" }, description: "5-8 evidence-based tips tailored to the COMBINATION." },
            techniques: { type: "array", items: { type: "string" }, description: "Recommended study techniques (e.g., Pomodoro, spaced repetition, dual-coding), each with a one-line why." },
            ai_features: { type: "array", items: { type: "string" }, description: "Which NeuroLearn features to lean on: Audio narration, Step-by-step breakdown, Mermaid diagrams, Summary, Quiz, Assignment planner, Re-explain differently, Library." },
            sample_routine: { type: "string", description: "A concrete sample daily/weekly routine with times." },
            productivity: { type: "array", items: { type: "string" } },
            break_schedule: { type: "string", description: "Recommended break cadence and what to do during breaks." },
            memory_recall: { type: "array", items: { type: "string" } },
            motivation: { type: "array", items: { type: "string" } },
            common_mistakes: { type: "array", items: { type: "string" } },
          },
          required: ["headline", "overview", "why_it_matters", "study_tips", "techniques", "ai_features", "sample_routine", "productivity", "break_schedule", "memory_recall", "motivation", "common_mistakes"],
        },
      },
    };
    const user = `The student selected these learning profiles:\n- ${data.profiles.join("\n- ")}\n\nCreate one integrated study strategy that reflects the FULL combination.`;
    const j = await callAI({ system, user, tools: [tool], toolChoice: { type: "function", function: { name: "deliver_strategy" } } });
    const call = j.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No strategy returned");
    return JSON.parse(call.function.arguments);
  });
