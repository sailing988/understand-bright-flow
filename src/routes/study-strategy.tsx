import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { generateStudyStrategy } from "@/lib/ai.functions";
import { LEARNING_PROFILES, profileById, profileTitles } from "@/lib/learning-profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles, RefreshCw, ArrowRight, BookOpen, Brain, Coffee, Lightbulb,
  ListChecks, Rocket, Target, TriangleAlert, Wand2,
} from "lucide-react";

export const Route = createFileRoute("/study-strategy")({
  component: StudyStrategy,
  head: () => ({
    meta: [
      { title: "Your Study Strategy — NeuroLearn" },
      { name: "description", content: "A personalized, AI-generated study plan combining your learning profiles into one cohesive strategy." },
      { property: "og:title", content: "Your Study Strategy — NeuroLearn" },
      { property: "og:description", content: "One integrated plan across all your learning profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Strategy = {
  headline: string;
  overview: string;
  why_it_matters: { profile: string; explanation: string }[];
  study_tips: string[];
  techniques: string[];
  ai_features: string[];
  sample_routine: string;
  productivity: string[];
  break_schedule: string;
  memory_recall: string[];
  motivation: string[];
  common_mistakes: string[];
};

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
      </CardContent>
    </Card>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ml-1 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function StudyStrategy() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { prefs, loaded } = usePreferences(user?.id ?? null);
  const generate = useServerFn(generateStudyStrategy);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const known = LEARNING_PROFILES.map((p) => p.id);
  const selected = loaded ? prefs.tags.filter((t) => known.includes(t)) : [];

  const run = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const titles = profileTitles(selected);
      const res = (await generate({ data: { profiles: titles } })) as Strategy;
      setStrategy(res);
    } catch (e: any) {
      toast.error(e?.message || "Could not generate strategy");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loaded && selected.length > 0 && !strategy && !busy) run();
    // eslint-disable-next-line
  }, [loaded]);

  if (loaded && selected.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Build your learning profile first</h1>
        <p className="mt-2 text-muted-foreground">Pick the profiles that describe how you study — we'll turn them into one personalized plan.</p>
        <Link to="/onboarding" className="mt-6 inline-block">
          <Button className="gap-2">Start onboarding <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Your personalized study strategy
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {strategy?.headline || "Crafting your plan…"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selected.map((id) => {
              const p = profileById(id);
              if (!p) return null;
              const Icon = p.icon;
              return (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {p.title}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/onboarding"><Button variant="outline" size="sm">Edit profile</Button></Link>
          <Button variant="outline" size="sm" onClick={run} disabled={busy} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Regenerate
          </Button>
        </div>
      </div>

      {busy && !strategy && (
        <div className="mt-10 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      )}

      {strategy && (
        <div className="mt-8 grid gap-4">
          <Section icon={Wand2} title="Why this plan looks like this">
            <p className="whitespace-pre-line">{strategy.overview}</p>
          </Section>

          <Section icon={Brain} title="Why each profile matters for you">
            <div className="grid gap-3 sm:grid-cols-2">
              {strategy.why_it_matters.map((w, i) => (
                <div key={i} className="rounded-lg border bg-card p-3">
                  <p className="text-sm font-semibold">{w.profile}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{w.explanation}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section icon={Lightbulb} title="Study tips tailored to you">
              <Bullets items={strategy.study_tips} />
            </Section>
            <Section icon={Target} title="Recommended techniques">
              <Bullets items={strategy.techniques} />
            </Section>
          </div>

          <Section icon={Sparkles} title="AI features to lean on in NeuroLearn">
            <Bullets items={strategy.ai_features} />
            <div className="mt-4">
              <Link to="/app"><Button size="sm" className="gap-2">Open workspace <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </Section>

          <Section icon={BookOpen} title="Sample study routine">
            <p className="whitespace-pre-line">{strategy.sample_routine}</p>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section icon={Rocket} title="Productivity">
              <Bullets items={strategy.productivity} />
            </Section>
            <Section icon={Coffee} title="Break schedule">
              <p className="whitespace-pre-line">{strategy.break_schedule}</p>
            </Section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Section icon={ListChecks} title="Memory & recall">
              <Bullets items={strategy.memory_recall} />
            </Section>
            <Section icon={Sparkles} title="Motivation">
              <Bullets items={strategy.motivation} />
            </Section>
          </div>

          <Section icon={TriangleAlert} title="Common mistakes to avoid">
            <Bullets items={strategy.common_mistakes} />
          </Section>
        </div>
      )}
    </div>
  );
}
