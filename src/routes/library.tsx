import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/library")({ component: Library });

type Session = { id: string; title: string | null; source_text: string; outputs: any; created_at: string };

function Library() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  const [items, setItems] = useState<Session[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const refresh = async () => {
    const { data } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
    setItems((data as Session[]) || []);
  };
  useEffect(() => { if (user) refresh(); }, [user]); // eslint-disable-line

  const remove = async (id: string) => {
    await supabase.from("sessions").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Library</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything you've transformed, ready to revisit.</p>
      <div className="mt-6 space-y-3">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Your saved sessions will appear here.
          </p>
        )}
        {items.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex-1 text-left">
                  <p className="font-medium">{s.title || "Untitled"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                </button>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {open === s.id && (
                <div className="mt-3 border-t pt-3">
                  {s.outputs?.summary && (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
                      <p className="mt-1 whitespace-pre-line text-sm">{s.outputs.summary}</p>
                    </>
                  )}
                  {Array.isArray(s.outputs?.steps) && (
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steps</p>
                      <ol className="mt-1 list-inside list-decimal space-y-1 text-sm">
                        {s.outputs.steps.map((st: any, i: number) => <li key={i}><strong>{st.heading}:</strong> {st.body}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
