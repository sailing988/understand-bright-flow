import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Braces, ChevronDown, Copy, Loader2, Trash2 } from "lucide-react";
import type { InspectorRecord } from "@/hooks/use-inspector";

function pretty(rec: InspectorRecord) {
  if (rec.status === "error") return `Error: ${rec.error}`;
  if (rec.status === "pending") return "Waiting for response…";
  try {
    return JSON.stringify(rec.payload, null, 2);
  } catch {
    return String(rec.payload);
  }
}

function statusClass(status: InspectorRecord["status"]) {
  if (status === "ok") return "border-success/40 bg-success/10 text-success";
  if (status === "error") return "border-destructive/40 bg-destructive/10 text-destructive";
  return "border-border bg-muted text-muted-foreground";
}

export function OutputInspector({ records, onClear }: { records: InspectorRecord[]; onClear: () => void }) {
  const [open, setOpen] = useState(false);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied JSON");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
              <Braces className="h-4 w-4 text-primary" />
              Output Inspector
              <span className="text-xs text-muted-foreground">({records.length} step{records.length === 1 ? "" : "s"})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            {open && records.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copy(records.map((r) => `// ${r.step}\n${pretty(r)}`).join("\n\n"))}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copy all
                </Button>
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <p className="mt-2 text-xs text-muted-foreground">
              Raw JSON returned by each AI pipeline step, before it is rendered into tabs, audio, checklists and diagrams.
            </p>
            {records.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No pipeline steps yet — transform some content to see raw output.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {records.map((rec) => {
                  const json = pretty(rec);
                  return (
                    <div key={rec.id} className="rounded-lg border bg-card">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-medium">{rec.step}</code>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass(rec.status)}`}>
                            {rec.status === "pending" ? <Loader2 className="h-3 w-3 animate-spin" /> : rec.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {rec.durationMs != null && <span>{rec.durationMs} ms</span>}
                          <span>{json.length} chars</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(json)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <pre className="max-h-72 overflow-auto p-3 text-xs leading-relaxed">{json}</pre>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
