import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Controls = {
  speed: "slow" | "medium" | "fast";
  tone: "calm" | "neutral" | "engaging";
  detail: "simple" | "standard" | "detailed";
  chunkSize: "very short" | "short" | "normal";
};

export type Preferences = { tags: string[]; controls: Controls };

const DEFAULTS: Preferences = {
  tags: [],
  controls: { speed: "medium", tone: "calm", detail: "standard", chunkSize: "short" },
};

export function usePreferences(userId: string | null) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPrefs(DEFAULTS);
      setLoaded(true);
      return;
    }
    supabase
      .from("user_preferences")
      .select("tags, controls")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            tags: (data.tags as string[]) || [],
            controls: { ...DEFAULTS.controls, ...((data.controls as any) || {}) },
          });
        }
        setLoaded(true);
      });
  }, [userId]);

  const save = useCallback(
    async (next: Preferences) => {
      setPrefs(next);
      if (!userId) return;
      await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, tags: next.tags, controls: next.controls, updated_at: new Date().toISOString() });
    },
    [userId]
  );

  return { prefs, setPrefs: save, loaded };
}
