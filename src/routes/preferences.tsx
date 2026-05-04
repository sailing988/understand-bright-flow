import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/preferences")({ component: Preferences });

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

function Preferences() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  const { prefs, setPrefs, loaded } = usePreferences(user?.id ?? null);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { if (loaded) setSelected(prefs.tags); }, [loaded]); // eslint-disable-line
  const [dyslexic, setDyslexic] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("dyslexic", dyslexic);
  }, [dyslexic]);

  const toggle = (t: string) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const save = async () => {
    await setPrefs({ ...prefs, tags: selected });
    toast.success("Preferences saved.");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <p className="mt-1 text-sm text-muted-foreground">These shape how every explanation, audio, and quiz is generated for you.</p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <p className="text-sm font-medium">What helps you learn?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

      <Card className="mt-4">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium">Reading-friendly spacing</p>
            <p className="text-xs text-muted-foreground">Wider letter and word spacing for easier reading.</p>
          </div>
          <Button variant={dyslexic ? "default" : "outline"} onClick={() => setDyslexic((v) => !v)}>{dyslexic ? "On" : "Off"}</Button>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end"><Button onClick={save}>Save</Button></div>
    </div>
  );
}
