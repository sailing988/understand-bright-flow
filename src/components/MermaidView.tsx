import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose", flowchart: { curve: "basis" } });

let counter = 0;

export function MermaidView({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !ref.current) return;
    setError(null);
    const id = `mmd-${++counter}`;
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => setError(String(e?.message || e)));
  }, [code]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Diagram could not render.</p>
        <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{code}</pre>
      </div>
    );
  }
  return <div ref={ref} className="overflow-auto rounded-lg border bg-card p-4 [&_svg]:mx-auto" />;
}
