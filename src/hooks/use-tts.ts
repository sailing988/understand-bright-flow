import { useCallback, useEffect, useRef, useState } from "react";

export type TTSControls = {
  speed: "slow" | "medium" | "fast";
  tone: "calm" | "neutral" | "engaging";
};

const SPEED_MAP = { slow: 0.85, medium: 1.0, fast: 1.2 } as const;
const TONE_MAP = {
  calm: { pitch: 0.95, rateMul: 0.95 },
  neutral: { pitch: 1.0, rateMul: 1.0 },
  engaging: { pitch: 1.1, rateMul: 1.05 },
} as const;

export function useTTSPlayer(segments: string[], controls: TTSControls) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const pickVoice = useCallback(() => {
    const eng = voices.filter((v) => v.lang.startsWith("en"));
    if (!eng.length) return null;
    if (controls.tone === "calm") return eng.find((v) => /female|samantha|karen|moira/i.test(v.name)) || eng[0];
    if (controls.tone === "engaging") return eng.find((v) => /google|natural|neural/i.test(v.name)) || eng[0];
    return eng[0];
  }, [voices, controls.tone]);

  const speakAt = useCallback(
    (i: number) => {
      if (typeof window === "undefined") return;
      const segs = segmentsRef.current;
      if (i >= segs.length) {
        setPlaying(false);
        setIndex(0);
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(segs[i]);
      const v = pickVoice();
      if (v) u.voice = v;
      const tone = TONE_MAP[controls.tone];
      u.rate = SPEED_MAP[controls.speed] * tone.rateMul;
      u.pitch = tone.pitch;
      u.onend = () => {
        setIndex((cur) => {
          const next = cur + 1;
          if (next < segmentsRef.current.length) {
            setTimeout(() => speakAt(next), 250);
            return next;
          }
          setPlaying(false);
          return 0;
        });
      };
      u.onerror = () => setPlaying(false);
      utterRef.current = u;
      setIndex(i);
      setPlaying(true);
      window.speechSynthesis.speak(u);
    },
    [controls.speed, controls.tone, pickVoice]
  );

  const play = useCallback(() => speakAt(index), [index, speakAt]);
  const pause = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);
  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setPlaying(false);
    setIndex(0);
  }, []);
  const jumpTo = useCallback((i: number) => speakAt(i), [speakAt]);

  return { index, playing, play, pause, stop, jumpTo };
}
