"use client";

import { useId, useSyncExternalStore } from "react";
import { read, serverSnapshot, subscribe, write } from "@/lib/browser/storage";
import { isLanguageId, LANGUAGES, type LanguageId } from "@/lib/ai/languages";

const KEY = "xplaind.tutor-language.v1";
const raw = () => read(KEY);

/** IL-1: the learner's chosen tutor language, kept on this device. */
export function useTutorLanguage(): LanguageId {
  const v = useSyncExternalStore(subscribe, raw, serverSnapshot);
  return isLanguageId(v) ? v : "en";
}

export function LanguagePicker({ className = "" }: { className?: string }) {
  const id = useId();
  const language = useTutorLanguage();
  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <label htmlFor={id} className="font-medium">
        Explain in
      </label>
      <select
        id={id}
        value={language}
        onChange={(e) => write(KEY, e.target.value === "en" ? null : e.target.value)}
        className="min-h-11 rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id} lang={l.id === "hinglish" ? "en" : l.id}>
            {l.id === "en" || l.id === "hinglish" ? l.name : `${l.native} (${l.name})`}
          </option>
        ))}
      </select>
    </div>
  );
}
