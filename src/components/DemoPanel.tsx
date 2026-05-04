import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MermaidView } from "@/components/MermaidView";
import { Headphones, Sparkles, TrendingUp } from "lucide-react";
import { useTTSPlayer } from "@/hooks/use-tts";

const SAMPLE = `Mitochondria are organelles found in eukaryotic cells. They are often called the "powerhouse of the cell" because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy. Mitochondria have their own DNA, separate from the nucleus, and replicate independently. The number of mitochondria in a cell varies depending on the cell type and energy demand — muscle and nerve cells contain particularly large numbers.`;

const BEFORE = SAMPLE;
const SUMMARY = `Mitochondria are tiny structures inside most cells. Their main job is making energy — a molecule called ATP — that the cell uses to do work. They're special because they have their own DNA and copy themselves. Cells that need lots of energy (like muscle and nerve cells) have more mitochondria.`;
const STEPS = [
  { heading: "What they are", body: "Tiny structures (organelles) inside cells with a nucleus." },
  { heading: "What they do", body: "Make ATP — the energy currency cells use for everything." },
  { heading: "Why that matters", body: "No ATP, no movement, no thinking, no growing." },
  { heading: "Cool fact", body: "They have their own DNA and copy themselves separately from the cell." },
  { heading: "Where there are most", body: "Muscle and nerve cells — anything that needs lots of energy." },
];
const SCRIPT = [
  "Let's talk about mitochondria. Don't let the long word scare you.",
  "Mitochondria are tiny parts inside your cells, called organelles, which just means little organs.",
  "Their main job is making energy. That energy is stored in a molecule called A T P.",
  "Think of A T P as the battery your cells use to do work.",
  "Without mitochondria, your muscles couldn't move, and your brain couldn't think.",
  "One cool thing: they have their own D N A, which means they can copy themselves.",
  "Cells that need a lot of energy, like muscle cells and nerve cells, have way more mitochondria.",
  "Quick recap: mitochondria are tiny energy makers. They produce A T P, the cell's battery, and there are more of them where energy is needed most.",
];
const MERMAID = `flowchart TD
  A[Cell] --> B[Mitochondria]
  B --> C[Make ATP]
  C --> D[Energy for cell]
  D --> E[Move / Think / Grow]
  B --> F[Own DNA]
  F --> G[Self-replicate]`;

export function DemoPanel() {
  const [tab, setTab] = useState("summary");
  const tts = useTTSPlayer(SCRIPT, { speed: "medium", tone: "calm" });

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" /> Demo: a sample biology paragraph, transformed.
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Before</p>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{BEFORE}</div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">After</p>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Simple</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed">{SUMMARY}</div>
              </TabsContent>
              <TabsContent value="steps">
                <ol className="space-y-2">
                  {STEPS.map((s, i) => (
                    <li key={i} className="rounded-lg border bg-card p-3">
                      <p className="text-xs font-semibold text-primary">Step {i + 1} · {s.heading}</p>
                      <p className="mt-1 text-sm">{s.body}</p>
                    </li>
                  ))}
                </ol>
              </TabsContent>
              <TabsContent value="audio">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Button size="sm" onClick={tts.playing ? tts.pause : tts.play}>
                      <Headphones className="mr-2 h-4 w-4" />
                      {tts.playing ? "Pause" : "Play"}
                    </Button>
                    <span className="text-xs text-muted-foreground">{tts.index + 1} / {SCRIPT.length}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {SCRIPT.map((seg, i) => (
                      <p key={i} className={i === tts.index ? "rounded bg-primary/10 px-2 py-1 text-foreground" : "px-2 py-1 text-muted-foreground"}>{seg}</p>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="visual">
                <MermaidView code={MERMAID} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
          <TrendingUp className="h-5 w-5 text-success" />
          <div className="text-sm">
            <p className="font-medium">Simulated comprehension lift: <span className="text-success">42% → 89%</span></p>
            <p className="text-muted-foreground">Across this demo's quick recall quiz, in chunked + multimodal format vs. raw text.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
