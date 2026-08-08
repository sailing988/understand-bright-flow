import { useCallback, useState } from "react";

export type InspectorStatus = "pending" | "ok" | "error";

export type InspectorRecord = {
  id: string;
  step: string;
  status: InspectorStatus;
  startedAt: number;
  durationMs?: number;
  payload?: unknown;
  error?: string;
};

let counter = 0;

export function useInspector() {
  const [records, setRecords] = useState<InspectorRecord[]>([]);

  const start = useCallback((step: string) => {
    const id = `${Date.now()}-${counter++}`;
    setRecords((r) => [...r, { id, step, status: "pending", startedAt: Date.now() }]);
    return id;
  }, []);

  const succeed = useCallback((id: string, payload: unknown) => {
    setRecords((r) =>
      r.map((rec) =>
        rec.id === id
          ? { ...rec, status: "ok" as const, payload, durationMs: Date.now() - rec.startedAt }
          : rec,
      ),
    );
  }, []);

  const fail = useCallback((id: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    setRecords((r) =>
      r.map((rec) =>
        rec.id === id
          ? { ...rec, status: "error" as const, error: message, durationMs: Date.now() - rec.startedAt }
          : rec,
      ),
    );
  }, []);

  const clear = useCallback(() => setRecords([]), []);

  /** Wrap an async pipeline step so its raw result is recorded. */
  const track = useCallback(
    async <T,>(step: string, fn: () => Promise<T>): Promise<T> => {
      const id = start(step);
      try {
        const result = await fn();
        succeed(id, result);
        return result;
      } catch (e) {
        fail(id, e);
        throw e;
      }
    },
    [start, succeed, fail],
  );

  return { records, start, succeed, fail, clear, track };
}
