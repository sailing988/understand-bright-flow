import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function sb(token: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_assignment",
  title: "Create assignment",
  description: "Create a new planner assignment for the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).max(500).describe("Assignment title."),
    due_at: z.string().datetime().optional().describe("Optional ISO 8601 due date."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, due_at }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx.getToken())
      .from("assignments")
      .insert({ user_id: ctx.getUserId(), title, due_at: due_at ?? null })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created assignment "${data.title}" (id: ${data.id}).` }],
      structuredContent: { assignment: data },
    };
  },
});
