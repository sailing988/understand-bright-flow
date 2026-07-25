import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { LEARNING_PROFILES } from "@/lib/learning-profiles";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
  head: () => ({
    meta: [
      { title: "Build Your Learning Profile — NeuroLearn" },
      { name: "description", content: "Select the learning profiles that describe how you study best. NeuroLearn tailors every explanation, audio, and quiz to your brain." },
      { property: "og:title", content: "Build Your Learning Profile — NeuroLearn" },
      { property: "og:description", content: "Personalize your study experience by picking the profiles that fit you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Onboarding() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { prefs, setPrefs, loaded } = usePreferences(user?.id ?? null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  useEffect(() => {
    if (loaded) {
      // migrate: keep only known profile ids
      const known = new Set(LEARNING_PROFILES.map((p) => p.id));
      setSelected(prefs.tags.filter((t) => known.has(t)));
    }
  }, [loaded]); // eslint-disable-line

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    await setPrefs({ ...prefs, tags: selected });
    nav({ to: "/study-strategy" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Build your learning profile
      </div>
      <h1 className="text-3xl font-semibold sm:text-4xl">How do you learn best?</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Pick every profile that fits you — there are no wrong answers. NeuroLearn combines your choices into one personalized study strategy and adapts every explanation, audio, diagram, and quiz to match.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_PROFILES.map((p) => {
          const on = selected.includes(p.id);
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                on
                  ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${p.accent} opacity-70`} />
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${on ? "bg-primary text-primary-foreground" : "bg-background text-primary"} shadow-sm transition`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background/60"
                  }`}
                  aria-hidden
                >
                  {on && <Check className="h-4 w-4" />}
                </span>
              </div>
              <p className="mt-4 text-base font-semibold leading-tight">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-2xl border bg-background/90 p-4 shadow-lg backdrop-blur">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{selected.length}</span> profile{selected.length === 1 ? "" : "s"} selected
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => nav({ to: "/app" })}>Skip for now</Button>
          <Button onClick={submit} disabled={selected.length === 0} className="gap-2">
            Generate my study strategy <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
