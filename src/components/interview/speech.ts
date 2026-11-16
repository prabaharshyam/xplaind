"use client";
// Speech in the browser for the mock interviews: speech-to-text (Web Speech API recognition) and reading
// questions aloud (speech synthesis). Audio never leaves this code for our servers (VI-2); only the text
// the learner sees is ever sent anywhere. Shared by the timed mock and the AI voice interviewer.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// ---- speech-to-text (Chrome, Edge, Safari; not Firefox) --------------------

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart?: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

/**
 * One recogniser for the whole page. iPhone browsers all use Safari's speech engine, which runs one
 * recognition at a time and silently gives a new one no audio while the last is still shutting down,
 * so a fresh recogniser per question went deaf from question 2 on. `active` is true from start()
 * until the browser reports the end.
 */
let shared: { r: Recognition; active: boolean } | null = null;
function sharedRecognizer(Ctor: RecognitionCtor) {
  if (!shared) shared = { r: new Ctor(), active: false };
  return shared;
}

/** Stops any recognition at once (leaving a question, or the page). */
export const abortRecognition = () => shared?.r.abort();

/** How long to wait for sound after the microphone starts before telling the learner it is not working. */
export const HEAR_TIMEOUT_MS = 5000;

/** Indian English first (VI-2): it recognises Indian names, places and accents better than en-US. */
export const SPEECH_LANG = "en-IN";

const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const noop = () => () => {};
export const useSpeechSupported = () => useSyncExternalStore(noop, () => recognitionCtor() !== null, () => false);

export const joinText = (a: string, b: string) => (a && b ? `${a.replace(/\s+$/, "")} ${b.trim()}` : a || b.trim());

export const MIC_BLOCKED =
  "The microphone is blocked, so type your answer. To speak instead, allow the microphone for this site in your browser's settings, then reload the page.";

/**
 * Dictation into a text box: start, stop and toggle the shared recogniser, with the words heard so far
 * (`text`), the words still being recognised (`interim`), and a plain message when something goes wrong.
 * `onStart` runs when listening starts; `onBlocked` when the browser refuses the microphone.
 */
export function useDictation({ onStart, onBlocked }: { onStart?: () => void; onBlocked?: () => void } = {}) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const wantListening = useRef(false);
  const heardTimer = useRef<number | null>(null);

  const clearHeardTimer = useCallback(() => {
    if (heardTimer.current !== null) window.clearTimeout(heardTimer.current);
    heardTimer.current = null;
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    clearHeardTimer();
    shared?.r.stop();
    setListening(false);
    setInterim("");
  }, [clearHeardTimer]);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    onStart?.();
    const s = sharedRecognizer(Ctor);
    const r = s.r;
    // If no sound reaches us soon after a start, say so plainly instead of showing "Listening…" forever.
    const expectSound = (message: string) => {
      clearHeardTimer();
      heardTimer.current = window.setTimeout(() => {
        heardTimer.current = null;
        wantListening.current = false;
        r.abort();
        setListening(false);
        setInterim("");
        setNotice(message);
      }, HEAR_TIMEOUT_MS);
    };
    r.lang = SPEECH_LANG;
    r.continuous = true;
    r.interimResults = true;
    r.onaudiostart = clearHeardTimer;
    r.onresult = (e) => {
      clearHeardTimer();
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) setText((t) => joinText(t, finalText));
      setInterim(interimText);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      clearHeardTimer();
      wantListening.current = false;
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setNotice(MIC_BLOCKED);
        onBlocked?.();
      } else {
        setNotice("Speech-to-text stopped working. Type the rest of your answer, or press the microphone again.");
      }
    };
    // Browsers end recognition after a pause; carry on while the learner still wants it. Phones may
    // refuse a restart that no tap started, so the sound check turns the microphone off if it stays quiet.
    r.onend = () => {
      s.active = false;
      if (!wantListening.current) {
        clearHeardTimer();
        setListening(false);
        return;
      }
      try {
        r.start();
        s.active = true;
        expectSound("The microphone paused. Tap “Speak more” to carry on, or type the rest of your answer.");
      } catch {
        setListening(false);
      }
    };
    wantListening.current = true;
    const begin = () => {
      r.start();
      s.active = true;
      setListening(true);
      setNotice(null);
      expectSound("The microphone isn't picking up any sound. Tap “Start speaking” to try again, or type your answer.");
    };
    try {
      if (s.active) r.abort(); // a recognition from the last question is still closing
      begin();
    } catch {
      // Still closing: start as soon as the browser says it has ended.
      r.onend = () => {
        s.active = false;
        try {
          begin();
        } catch {
          setListening(false);
          setNotice("The microphone couldn't start. Tap “Start speaking” again, or type your answer.");
        }
      };
    }
  }, [clearHeardTimer, onBlocked, onStart]);

  const toggle = useCallback(() => {
    if (wantListening.current) stop();
    else start();
  }, [start, stop]);

  /** Stops everything at once, for leaving the question. */
  const abort = useCallback(() => {
    wantListening.current = false;
    clearHeardTimer();
    shared?.r.abort();
    setListening(false);
    setInterim("");
  }, [clearHeardTimer]);

  useEffect(
    () => () => {
      wantListening.current = false;
      if (heardTimer.current !== null) window.clearTimeout(heardTimer.current);
      shared?.r.abort();
    },
    [],
  );

  return { text, setText, interim, listening, notice, setNotice, start, stop, toggle, abort };
}

// ---- reading questions aloud ----------------------------------------------

const synth = (): SpeechSynthesis | null => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);
export const useSpeechOutSupported = () => useSyncExternalStore(noop, () => synth() !== null, () => false);

/**
 * The voice to read questions in: Indian English when the device has one, then other English voices,
 * local ones first (they start faster and work offline). Pure, for tests.
 */
export function pickVoice<V extends { lang: string; localService: boolean }>(voices: readonly V[]): V | null {
  const rank = (v: V) => {
    const lang = v.lang.replace("_", "-").toLowerCase();
    const base = lang === "en-in" ? 0 : lang === "en-gb" ? 1 : lang.startsWith("en") ? 2 : 9;
    return base * 2 + (v.localService ? 0 : 1);
  };
  const english = voices.filter((v) => rank(v) < 18);
  return english.length ? [...english].sort((a, b) => rank(a) - rank(b))[0] : null;
}

/** Reads text aloud; `onEnd` runs when it finishes or cannot play. Returns false when the browser cannot speak. */
export function speak(text: string, onEnd?: () => void): boolean {
  const s = synth();
  if (!s) return false;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(s.getVoices());
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? SPEECH_LANG;
  u.rate = 0.95; // a little slower than default: easier to follow for a second-language listener
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  s.speak(u);
  return true;
}

export const stopSpeaking = () => synth()?.cancel();
