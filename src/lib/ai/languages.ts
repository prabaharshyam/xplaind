// IL-1 (2026-11-14, owner decision): the AI tutor can explain in Indian languages. Pure.

export const LANGUAGES = [
  { id: "en", name: "English", native: "English" },
  { id: "hinglish", name: "Hinglish", native: "Hinglish" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "te", name: "Telugu", native: "తెలుగు" },
  { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { id: "ml", name: "Malayalam", native: "മലയാളം" },
  { id: "mr", name: "Marathi", native: "मराठी" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "gu", name: "Gujarati", native: "ગુજરાતી" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [LanguageId, ...LanguageId[]];

export const isLanguageId = (v: unknown): v is LanguageId => typeof v === "string" && (LANGUAGE_IDS as string[]).includes(v);

/** The instruction added to the tutor's system prompt; empty for English. */
export function languageRule(id: LanguageId): string {
  if (id === "en") return "";
  const common =
    "Keep technical terms (for example RAG, embedding, API, token, fine-tuning), product and model names, code and code comments in English; the first time you translate a technical idea, put the English term in brackets so the learner can search for it and use it in interviews. Keep the lesson ids and the structure of your reply exactly as asked.";
  if (id === "hinglish") return `Reply in Hinglish: everyday Hindi written in English letters, mixed with English the way people talk in Indian offices. ${common}`;
  const lang = LANGUAGES.find((l) => l.id === id)!;
  return `Reply in ${lang.name} (${lang.native}), in its own script, in simple everyday words rather than formal or literary ones. ${common}`;
}
