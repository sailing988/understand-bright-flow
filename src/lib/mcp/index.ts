import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAssignments from "./tools/list-assignments";
import createAssignment from "./tools/create-assignment";
import listLibrary from "./tools/list-library";
import transformContent from "./tools/transform-content";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "neurolearn-mcp",
  title: "NeuroLearn",
  version: "0.1.0",
  instructions:
    "Tools for NeuroLearn, an AI learning assistant for neurodivergent students. Read and create the user's planner assignments, list their saved learning sessions, and transform academic text into accessible learning formats (summary, step-by-step breakdown, Mermaid diagram).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAssignments, createAssignment, listLibrary, transformContent],
});
