// SE-12 (2026-11-18, site review: "Start a AI Engineer mock interview"): "a" or "an" before a name, by
// how it is said. Vowels take "an"; so do acronyms whose first letter is said with a vowel sound
// ("an MLOps", "an SQL"). Pure, for tests.
const VOWEL_SOUND_LETTERS = new Set(["A", "E", "F", "H", "I", "L", "M", "N", "O", "R", "S", "X"]);

export function article(word: string): "a" | "an" {
  const w = word.trim();
  if (/^[AEIOUaeiou]/.test(w)) return /^(uni|use|usu|eu|one)/i.test(w) ? "a" : "an";
  // An acronym: two capitals in a row, said letter by letter.
  if (/^[A-Z]{2}/.test(w) && VOWEL_SOUND_LETTERS.has(w[0])) return "an";
  return "a";
}

/** "an AI Engineer", "a Machine Learning Engineer". */
export const withArticle = (word: string) => `${article(word)} ${word}`;
