/** "Tanglish" and "Hinglish" are English words; only a label in the language's own script carries its language. */
export const labelLang = (lang: string) => (lang.endsWith("-Latn") ? "en" : lang);
