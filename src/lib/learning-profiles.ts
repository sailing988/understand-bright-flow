import {
  Zap, Clock, Layers, Eye, Headphones, PenLine, Repeat, Focus,
  HeartPulse, ListChecks, Moon, Timer, type LucideIcon,
} from "lucide-react";

export type LearningProfile = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind gradient classes
};

export const LEARNING_PROFILES: LearningProfile[] = [
  { id: "easily_distracted", title: "Easily Distracted", description: "I lose focus easily and get distracted.", icon: Zap, accent: "from-amber-400/20 to-orange-500/10" },
  { id: "time_blind", title: "Time Blind", description: "I underestimate how long assignments take.", icon: Clock, accent: "from-sky-400/20 to-indigo-500/10" },
  { id: "overwhelmed_large", title: "Overwhelmed by Large Assignments", description: "I don't know where to start.", icon: Layers, accent: "from-rose-400/20 to-pink-500/10" },
  { id: "visual_learner", title: "Visual Learner", description: "I understand diagrams, colors, and charts best.", icon: Eye, accent: "from-emerald-400/20 to-teal-500/10" },
  { id: "audio_learner", title: "Audio Learner", description: "I remember things better when I hear them.", icon: Headphones, accent: "from-violet-400/20 to-purple-500/10" },
  { id: "learns_by_writing", title: "Learns by Writing", description: "I remember information by taking notes.", icon: PenLine, accent: "from-lime-400/20 to-green-500/10" },
  { id: "needs_repetition", title: "Needs Repetition", description: "I have to review concepts multiple times.", icon: Repeat, accent: "from-cyan-400/20 to-blue-500/10" },
  { id: "hyperfocus", title: "Hyperfocus", description: "I sometimes spend too much time on one task.", icon: Focus, accent: "from-fuchsia-400/20 to-purple-500/10" },
  { id: "test_anxiety", title: "Test Anxiety", description: "I get nervous during quizzes and exams.", icon: HeartPulse, accent: "from-red-400/20 to-rose-500/10" },
  { id: "executive_function", title: "Executive Function Support", description: "I need help organizing and planning.", icon: ListChecks, accent: "from-indigo-400/20 to-blue-500/10" },
  { id: "night_studier", title: "Night Studier", description: "I'm most productive later in the day.", icon: Moon, accent: "from-slate-400/20 to-indigo-500/10" },
  { id: "short_sessions", title: "Short Study Sessions", description: "I work best in small chunks.", icon: Timer, accent: "from-teal-400/20 to-cyan-500/10" },
];

export function profileById(id: string) {
  return LEARNING_PROFILES.find((p) => p.id === id);
}

export function profileTitles(ids: string[]) {
  return ids.map((id) => profileById(id)?.title || id);
}
