import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences, type Controls } from "@/hooks/use-preferences";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { transformContent, generateTTSScript, generateQuiz, explainDifferently, extractTextFromImage } from "@/lib/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MermaidView } from "@/components/MermaidView";
import { OutputInspector } from "@/components/OutputInspector";
import { useInspector } from "@/hooks/use-inspector";
import { useTTSPlayer } from "@/hooks/use-tts";
import { toast } from "sonner";
import { Loader2, Headphones, Wand2, ImageIcon, Save, RefreshCw, ChevronRight, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app")({ component: Workspace });

type Outputs = {
  title: string;
  summary: string;
  steps: { heading: string; body: string }[];
  mermaid: string;
};
type QuizQ = { question: string; options: string[]; correctIndex: number; explanation: string };

function Workspace() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { prefs, setPrefs, loaded } = usePreferences(user?.id ?? null);
  useEffect(() => { if (!authLoading && !user) nav({ to: "/login" }); }, [authLoading, user, nav]);

  const transformFn = useServerFn(transformContent);
  const scriptFn = useServerFn(generateTTSScript);
  const quizFn = useServerFn(generateQuiz);
  const explainFn = useServerFn(explainDifferently);
  const ocrFn = useServerFn(extractTextFromImage);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [segments, setSegments] = useState<string[]>([]);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reexplain, setReexplain] = useState<string | null>(null);
  const [reLoading, setReLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inspector = useInspector();

  const tts = useTTSPlayer(segments, { speed: prefs.controls.speed, tone: prefs.controls.tone });

  const updateControl = <K extends keyof Controls>(k: K, v: Controls[K]) => {
    setPrefs({ ...prefs, controls: { ...prefs.controls, [k]: v } });
  };

  const logEvent = async (event_type: string, meta: any = {}) => {
    if (!user) return;
    await supabase.from("interaction_events").insert({ user_id: user.id, event_type, meta });
  };

  const handleTransform = async () => {
    if (text.trim().length < 10) return toast.error("Add more text to transform.");
    setLoading(true);
    setOutputs(null);
    setSegments([]);
    setQuiz(null);
    setQuizSubmitted(false);
    setReexplain(null);
    try {
      const res = await inspector.track("transformContent", () => transformFn({ data: { text, preferences: prefs } }));
      setOutputs(res as Outputs);
      logEvent("transform", { length: text.length });
      // Save session
      if (user) {
        const { data } = await supabase.from("sessions").insert({
          user_id: user.id,
          title: (res as Outputs).title || text.slice(0, 60),
          source_text: text,
          outputs: res as any,
        }).select("id").single();
        if (data) setSessionId(data.id);
      }
      // Auto-generate audio script in background
      regenerateScript(text);
    } catch (e: any) {
      toast.error(e.message || "Transform failed");
    } finally {
      setLoading(false);
    }
  };

  const regenerateScript = async (sourceText: string) => {
    setScriptLoading(true);
    try {
      const res = await inspector.track("generateTTSScript", () => scriptFn({ data: { text: sourceText, preferences: prefs } }));
      setSegments(((res as any).segments as string[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Audio script failed");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleQuiz = async () => {
    if (!outputs) return;
    try {
      const res = await inspector.track("generateQuiz", () => quizFn({ data: { text: outputs.summary } }));
      const qs = ((res as any).questions as QuizQ[]) || [];
      setQuiz(qs);
      setQuizAnswers(new Array(qs.length).fill(-1));
      setQuizSubmitted(false);
    } catch (e: any) {
      toast.error(e.message || "Quiz failed");
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setQuizSubmitted(true);
    const score = quiz.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correctIndex ? 1 : 0), 0);
    if (user) {
      await supabase.from("quiz_results").insert({
        user_id: user.id,
        session_id: sessionId,
        score,
        total: quiz.length,
        details: { answers: quizAnswers },
      });
    }
    logEvent("quiz_submitted", { score, total: quiz.length });
    if (score < quiz.length) {
      toast.info("Let's try a different angle for what you missed.");
      const missed = quiz.filter((_, i) => quizAnswers[i] !== quiz[i].correctIndex).map((q) => q.question).join(" ");
      handleReexplain("simpler", `${outputs?.summary ?? ""}\n\nFocus areas: ${missed}`);
    } else {
      toast.success("Perfect score! 🎉");
    }
  };

  const handleReexplain = async (style: "simpler" | "stepwise" | "analogy" | "visual", source?: string) => {
    const src = source ?? outputs?.summary ?? text;
    if (!src) return;
    setReLoading(true);
    setReexplain(null);
    try {
      const res = await inspector.track(`explainDifferently (${style})`, () => explainFn({ data: { text: src, style, preferences: prefs } }));
      setReexplain((res as any).explanation as string);
      logEvent("explain_differently", { style });
    } catch (e: any) {
      toast.error(e.message || "Re-explain failed");
    } finally {
      setReLoading(false);
    }
  };

  const appendText = (chunk: string) => setText((t) => (t ? t + "\n\n" : "") + chunk);

  const readAsDataURL = (file: File) => new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });

  const readAsText = (file: File) => new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsText(file);
  });

  const extractPdf = async (file: File): Promise<string> => {
    const pdfjs: any = await import("pdfjs-dist");
    // @ts-ignore
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
    }
    return out.trim();
  };

  const extractDocx = async (file: File): Promise<string> => {
    const mammoth = await import("mammoth/mammoth.browser");
    const buf = await file.arrayBuffer();
    const { value } = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    return value;
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 20_000_000) return toast.error("File too large (max 20MB).");
    const name = file.name.toLowerCase();
    const type = file.type;
    try {
      if (type.startsWith("image/")) {
        toast.info("Reading image...");
        const dataUrl = await readAsDataURL(file);
        const res = await ocrFn({ data: { imageDataUrl: dataUrl } });
        appendText((res as any).text || "");
        toast.success("Text extracted from image.");
      } else if (type === "application/pdf" || name.endsWith(".pdf")) {
        toast.info("Reading PDF...");
        const txt = await extractPdf(file);
        if (!txt) throw new Error("No selectable text — try uploading as image for OCR.");
        appendText(txt);
        toast.success("PDF text extracted.");
      } else if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        toast.info("Reading Word document...");
        const txt = await extractDocx(file);
        appendText(txt);
        toast.success("Document text extracted.");
      } else if (name.endsWith(".doc")) {
        throw new Error("Legacy .doc not supported — please save as .docx or PDF.");
      } else if (type.startsWith("text/") || name.match(/\.(txt|md|csv|rtf)$/)) {
        const txt = await readAsText(file);
        appendText(txt);
        toast.success("File loaded.");
      } else {
        throw new Error("Unsupported file type. Use TXT, MD, PDF, DOCX, or an image.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to read file");
    }
  };

  if (!loaded || authLoading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">Paste content, upload an image of notes, and transform it into the format that works for you.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* INPUT */}
          <Card>
            <CardContent className="p-5">
              <Label htmlFor="src" className="text-sm font-medium">Source content</Label>
              <Textarea
                id="src"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a paragraph, lecture notes, a textbook section…"
                className="mt-2 min-h-40"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleTransform} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Transform
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf,.pdf,.docx,.txt,.md,.csv,.rtf,text/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Upload file (image, PDF, DOCX, TXT)
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{text.length} chars</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setText("");
                      setOutputs(null);
                      setSegments([]);
                      setQuiz(null);
                      setQuizSubmitted(false);
                      setReexplain(null);
                      setSessionId(null);
                    }}
                    disabled={!text && !outputs}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clean content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OUTPUTS */}
          {outputs && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold">{outputs.title}</h2>
                <Tabs defaultValue="summary" className="mt-3">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="steps">Steps</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="diagram">Diagram</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary" className="mt-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed">{outputs.summary}</p>
                  </TabsContent>
                  <TabsContent value="steps" className="mt-4">
                    <ol className="space-y-2">
                      {outputs.steps.map((s, i) => (
                        <li key={i} className="rounded-lg border bg-card p-3">
                          <p className="text-xs font-semibold text-primary">Step {i + 1} · {s.heading}</p>
                          <p className="mt-1 text-sm leading-relaxed">{s.body}</p>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                  <TabsContent value="audio" className="mt-4">
                    {scriptLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Preparing your audio script…</div>
                    ) : segments.length === 0 ? (
                      <Button onClick={() => regenerateScript(text)}><Headphones className="mr-2 h-4 w-4" /> Generate audio</Button>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <Button size="sm" onClick={tts.playing ? tts.pause : tts.play}>
                            {tts.playing ? "Pause" : "Play"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={tts.stop}>Stop</Button>
                          <Button size="sm" variant="ghost" onClick={() => regenerateScript(text)}>
                            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Regenerate
                          </Button>
                          <span className="ml-auto text-xs text-muted-foreground">{tts.index + 1} / {segments.length}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {segments.map((seg, i) => (
                            <button
                              key={i}
                              onClick={() => tts.jumpTo(i)}
                              className={`block w-full rounded px-2 py-1.5 text-left transition ${i === tts.index ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"}`}
                            >
                              {seg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="diagram" className="mt-4">
                    <MermaidView code={outputs.mermaid} />
                  </TabsContent>
                </Tabs>

                {/* Explain differently */}
                <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-medium">Explain it differently</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["simpler", "Even simpler"],
                      ["stepwise", "Step-by-step"],
                      ["analogy", "Real-world analogy"],
                      ["visual", "Describe visually"],
                    ].map(([style, label]) => (
                      <Button key={style} size="sm" variant="outline" onClick={() => handleReexplain(style as any)} disabled={reLoading}>
                        {label}
                      </Button>
                    ))}
                  </div>
                  {reLoading && <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Rethinking…</div>}
                  {reexplain && <div className="mt-3 whitespace-pre-line rounded-lg border bg-card p-3 text-sm leading-relaxed">{reexplain}</div>}
                </div>

                {/* Quiz */}
                <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Check your understanding</p>
                    {!quiz && <Button size="sm" onClick={handleQuiz}>Quick quiz <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>}
                  </div>
                  {quiz && (
                    <div className="mt-4 space-y-4">
                      {quiz.map((q, qi) => (
                        <div key={qi} className="rounded-lg border bg-card p-3">
                          <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                          <div className="mt-2 space-y-1.5">
                            {q.options.map((opt, oi) => {
                              const picked = quizAnswers[qi] === oi;
                              const correct = quizSubmitted && oi === q.correctIndex;
                              const wrong = quizSubmitted && picked && oi !== q.correctIndex;
                              return (
                                <button
                                  key={oi}
                                  disabled={quizSubmitted}
                                  onClick={() => setQuizAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                                    correct ? "border-success bg-success/10" : wrong ? "border-destructive bg-destructive/10" : picked ? "border-primary bg-primary/5" : "hover:bg-muted"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>}
                        </div>
                      ))}
                      {!quizSubmitted ? (
                        <Button onClick={submitQuiz} disabled={quizAnswers.includes(-1)}>Submit</Button>
                      ) : (
                        <Button variant="outline" onClick={handleQuiz}><RefreshCw className="mr-2 h-3.5 w-3.5" /> New quiz</Button>
                      )}
                    </div>
                  )}
                </div>

                {sessionId && (
                  <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                    <Save className="h-3.5 w-3.5" /> Saved to your library
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* CONTROLS SIDEBAR */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium">Adapt to me</p>
              <div className="mt-4 space-y-4">
                <ControlSelect label="Speech speed" value={prefs.controls.speed} onChange={(v) => updateControl("speed", v as any)} options={["slow", "medium", "fast"]} />
                <ControlSelect label="Tone" value={prefs.controls.tone} onChange={(v) => updateControl("tone", v as any)} options={["calm", "neutral", "engaging"]} />
                <ControlSelect label="Detail level" value={prefs.controls.detail} onChange={(v) => updateControl("detail", v as any)} options={["simple", "standard", "detailed"]} />
                <ControlSelect label="Chunk size" value={prefs.controls.chunkSize} onChange={(v) => updateControl("chunkSize", v as any)} options={["very short", "short", "normal"]} />
              </div>
              {outputs && (
                <Button variant="outline" className="mt-4 w-full" size="sm" onClick={() => regenerateScript(text)}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Apply to audio
                </Button>
              )}
              {prefs.tags.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground">Active supports</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {prefs.tags.map((t) => (
                      <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ControlSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
