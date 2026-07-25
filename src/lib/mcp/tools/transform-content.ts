import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export default defineTool({
  name: "transform_content",
  title: "Transform learning content",
  description:
    "Convert academic text into neurodivergent-friendly learning outputs: a short title, plain-language summary, chunked step-by-step breakdown, and a Mermaid diagram.",
  inputSchema: {
    text: z.string().min(10).max(20000).describe("The academic text to transform."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ text }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { content: [{ type: "text", text: "AI gateway not configured" }], isError: true };

    const tool = {
      type: "function",
      function: {
        name: "deliver_outputs",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: { heading: { type: "string" }, body: { type: "string" } },
                required: ["heading", "body"],
              },
            },
            mermaid: { type: "string" },
          },
          required: ["title", "summary", "steps", "mermaid"],
        },
      },
    };

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You convert academic content into accessible learning formats for neurodivergent students. Plain language, define hard terms inline, short paragraphs.",
          },
          { role: "user", content: `Transform this content:\n\n${text}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "deliver_outputs" } },
      }),
    });

    if (!res.ok) {
      return { content: [{ type: "text", text: `AI gateway error ${res.status}` }], isError: true };
    }
    const j = await res.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};
    return {
      content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      structuredContent: parsed,
    };
  },
});
