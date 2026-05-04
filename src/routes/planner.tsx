import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { breakDownAssignment } from "@/server/ai.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Bell, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/planner")({ component: Planner });

type Step = { id: string; assignment_id: string; title: string; estimate_minutes: number | null; done: boolean; remind_at: string | null; position: number };
type Assignment = { id: string; title: string; description: string | null; created_at: string };

function Planner() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const breakDown = useServerFn(breakDownAssignment);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stepsByA, setStepsByA] = useState<Record<string, Step[]>>({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const { data: a } = await supabase.from("assignments").select("*").order("created_at", { ascending: false });
    setAssignments((a as Assignment[]) || []);
    const { data: s } = await supabase.from("assignment_steps").select("*").order("position");
    const m: Record<string, Step[]> = {};
    ((s as Step[]) || []).forEach((st) => { (m[st.assignment_id] ||= []).push(st); });
    setStepsByA(m);
  };

  useEffect(() => { if (user) refresh(); }, [user]); // eslint-disable-line

  // Browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Reminder check loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      Object.values(stepsByA).flat().forEach((st) => {
        if (st.done || !st.remind_at) return;
        const t = new Date(st.remind_at).getTime();
        if (t <= now && t > now - 60_000) {
          toast.info(`Reminder: ${st.title}`, { duration: 8000 });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("NeuroLearn reminder", { body: st.title });
          }
        }
      });
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [stepsByA]);

  const create = async () => {
    if (!user || draft.trim().length < 5) return toast.error("Describe the assignment first.");
    setBusy(true);
    try {
      const res = await breakDown({ data: { assignment: draft } });
      const r = res as { title: string; steps: { title: string; estimateMinutes: number }[] };
      const { data: a, error } = await supabase.from("assignments").insert({
        user_id: user.id,
        title: r.title || draft.slice(0, 60),
        description: draft,
      }).select().single();
      if (error || !a) throw error;
      const rows = r.steps.map((s, i) => ({
        assignment_id: a.id,
        user_id: user.id,
        title: s.title,
        estimate_minutes: s.estimateMinutes,
        position: i,
      }));
      await supabase.from("assignment_steps").insert(rows);
      setDraft("");
      toast.success("You've got this — broken into bite-size steps.");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Could not break down");
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = async (st: Step) => {
    await supabase.from("assignment_steps").update({ done: !st.done }).eq("id", st.id);
    if (!st.done) toast.success("Nice — one step done. Take a breath.");
    refresh();
  };

  const setRemindAt = async (st: Step, value: string) => {
    const iso = value ? new Date(value).toISOString() : null;
    await supabase.from("assignment_steps").update({ remind_at: iso }).eq("id", st.id);
    refresh();
  };

  const removeAssignment = async (id: string) => {
    await supabase.from("assignments").delete().eq("id", id);
    refresh();
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Planner</h1>
      <p className="mt-1 text-sm text-muted-foreground">Drop in any assignment. We'll break it into small, doable steps.</p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <Label htmlFor="d" className="text-sm font-medium">New assignment</Label>
          <Textarea
            id="d"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Write a 5-page essay on the causes of WWI, due Friday."
            className="mt-2 min-h-24"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={create} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Break it down
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        {assignments.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No assignments yet. Add one above and we'll plan it out together.
          </p>
        )}
        {assignments.map((a) => {
          const steps = stepsByA[a.id] || [];
          const done = steps.filter((s) => s.done).length;
          return (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{done} of {steps.length} steps done</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAssignment(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="mt-4 space-y-2">
                  {steps.map((st) => (
                    <li key={st.id} className={`flex items-start gap-3 rounded-lg border p-3 ${st.done ? "bg-muted/40" : "bg-card"}`}>
                      <Checkbox checked={st.done} onCheckedChange={() => toggleDone(st)} className="mt-0.5" />
                      <div className="flex-1">
                        <p className={`text-sm ${st.done ? "text-muted-foreground line-through" : ""}`}>{st.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {st.estimate_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{st.estimate_minutes} min</span>}
                          <label className="inline-flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            <Input
                              type="datetime-local"
                              className="h-7 w-auto text-xs"
                              defaultValue={st.remind_at ? new Date(st.remind_at).toISOString().slice(0, 16) : ""}
                              onBlur={(e) => setRemindAt(st, e.target.value)}
                            />
                          </label>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {steps.length > 0 && done === steps.length && (
                  <p className="mt-3 inline-flex items-center gap-1 text-sm text-success"><Sparkles className="h-4 w-4" /> Done! Be proud — that took focus.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
