"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionState = {
  listening: boolean;
  supported: boolean;
  transcript: string;
};

type SpeechRecognitionEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
};

export function useSpeechRecognition(onResult?: (text: string) => void) {
  const [state, setState] = useState<SpeechRecognitionState>({
    listening: false,
    supported: false,
    transcript: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).SpeechRecognition ??
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null;

    if (!SR) return;

    setState((s) => ({ ...s, supported: true }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SR as any)() as { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void };
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      const trimmed = text.trim();
      if (trimmed) {
        setState((s) => ({ ...s, transcript: trimmed }));
        onResultRef.current?.(trimmed);
      }
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, listening: false }));
    };

    recognition.onerror = () => {
      setState((s) => ({ ...s, listening: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch { /* noop */ }
    };
  }, []);

  const start = useCallback(() => {
    try {
      recognitionRef.current?.start();
      setState((s) => ({ ...s, listening: true, transcript: "" }));
    } catch { /* already started */ }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch { /* noop */ }
    setState((s) => ({ ...s, listening: false }));
  }, []);

  const toggle = useCallback(() => {
    if (state.listening) {
      stop();
    } else {
      start();
    }
  }, [state.listening, start, stop]);

  return { ...state, start, stop, toggle };
}
