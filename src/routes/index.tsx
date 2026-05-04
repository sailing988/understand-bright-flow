import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, Headphones, ListChecks, Network, Wand2, ArrowRight, BookOpen } from "lucide-react";
import { DemoPanel } from "@/components/DemoPanel";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Built for neurodivergent learners
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Learn the way <span className="text-primary">your brain works.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Drop in any text, PDF, or notes. NeuroLearn instantly turns it into audio, step-by-step
          breakdowns, visual diagrams, and plain-language summaries — and adapts to how you focus best.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => setShowDemo(true)}>
            <Wand2 className="mr-2 h-4 w-4" /> Try the demo
          </Button>
          <Link to="/signup"><Button size="lg" variant="outline">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>

      {showDemo && (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <DemoPanel />
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Headphones, title: "Conversational audio", body: "Warm, supportive narration that pauses, defines hard words, and ends with a recap." },
            { icon: ListChecks, title: "Step-by-step", body: "Long ideas broken into short, focused chunks you can take one at a time." },
            { icon: Network, title: "Visual diagrams", body: "Auto-generated flowcharts and concept maps to see how ideas connect." },
            { icon: BookOpen, title: "Plain-language summary", body: "The essentials, rewritten in clear sentences without the jargon." },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <Brain className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 text-3xl font-semibold">It learns how you learn.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell NeuroLearn what helps and what overwhelms you. Every explanation, every quiz,
            every audio script tunes itself to your pace, energy, and focus.
          </p>
          <Link to="/signup" className="mt-6 inline-block">
            <Button size="lg">Get started — it's free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
