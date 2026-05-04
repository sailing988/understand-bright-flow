import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const TAGS = [
  "I get overwhelmed by long text",
  "I prefer listening over reading",
  "I need step-by-step instructions",
  "I lose focus easily",
  "I like structured, predictable formats",
  "I think in pictures",
  "I need things repeated to remember",
  "I work better in short bursts",
  "I get anxious with too much info at once",
  "I do best with real-world examples",
];

function Onboarding() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { prefs, setPrefs, loaded } = usePreferences(user?.id ?? null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  useEffect(() => { if (loaded) setSelected(prefs.tags); }, [loaded]); // eslint-disable-line

  const toggle = (t: string) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const save = async () => {
    await setPrefs({ ...prefs, tags: selected });
    nav({ to: "/app" });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Personalize NeuroLearn
      </div>
      <h1 className="text-3xl font-semibold">What helps you learn best?</h1>
      <p className="mt-2 text-muted-foreground">Pick anything that fits — you can change these any time. There are no wrong answers.</p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {TAGS.map((t) => {
              const on = selected.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition ${on ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                    {on && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => nav({ to: "/app" })}>Skip for now</Button>
        <Button onClick={save}>Save and continue</Button>
      </div>
    </div>
  );
}
