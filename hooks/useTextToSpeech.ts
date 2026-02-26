"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const TTS_RATES = [1, 1.5, 2] as const;
export type TTSRate = (typeof TTS_RATES)[number];

type TTSState = {
  speaking: boolean;
  paused: boolean;
  rate: TTSRate;
  supported: boolean;
  loading: boolean;
};

export function useTextToSpeech() {
  const [state, setState] = useState<TTSState>({
    speaking: false,
    paused: false,
    rate: 1,
    supported: false,
    loading: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const backendRef = useRef<"elevenlabs" | "browser" | null>(null);
  const currentTextRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setState((s) => ({ ...s, supported }));
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (backendRef.current === "browser") {
      window.speechSynthesis?.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    backendRef.current = null;
    setState((s) => ({ ...s, speaking: false, paused: false, loading: false }));
  }, []);

  const speakBrowser = useCallback(
    (text: string, rate: TTSRate) => {
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.onend = () => {
        backendRef.current = null;
        setState((s) => ({ ...s, speaking: false, paused: false }));
      };
      utterance.onerror = (e) => {
        if (e.error === "canceled" || e.error === "interrupted") return;
        backendRef.current = null;
        setState((s) => ({ ...s, speaking: false, paused: false }));
      };

      backendRef.current = "browser";
      window.speechSynthesis.speak(utterance);
      setState((s) => ({ ...s, speaking: true, paused: false, loading: false }));
    },
    [],
  );

  const speak = useCallback(
    async (text: string) => {
      stop();
      currentTextRef.current = text;
      setState((s) => ({ ...s, loading: true }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (res.ok) {
          const blob = await res.blob();
          if (controller.signal.aborted) return;

          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;

          const audio = new Audio(url);
          audio.playbackRate = state.rate;
          audioRef.current = audio;
          backendRef.current = "elevenlabs";

          audio.onended = () => {
            URL.revokeObjectURL(url);
            blobUrlRef.current = null;
            backendRef.current = null;
            setState((s) => ({ ...s, speaking: false, paused: false }));
          };

          await audio.play();
          setState((s) => ({ ...s, speaking: true, loading: false }));
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      speakBrowser(text, state.rate);
    },
    [stop, state.rate, speakBrowser],
  );

  const pause = useCallback(() => {
    if (backendRef.current === "browser") {
      window.speechSynthesis?.pause();
    }
    audioRef.current?.pause();
    setState((s) => ({ ...s, paused: true }));
  }, []);

  const resume = useCallback(() => {
    if (backendRef.current === "browser") {
      window.speechSynthesis?.resume();
    }
    audioRef.current?.play();
    setState((s) => ({ ...s, paused: false }));
  }, []);

  const setRate = useCallback(
    (rate: TTSRate) => {
      setState((s) => ({ ...s, rate }));

      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }

      if (backendRef.current === "browser" && currentTextRef.current) {
        speakBrowser(currentTextRef.current, rate);
      }
    },
    [speakBrowser],
  );

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    setRate,
    rates: TTS_RATES,
  };
}
