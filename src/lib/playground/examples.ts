// PG-2: starter programs for the code playground. Short, runnable, and each one teaches an idea
// from the lessons. Pure data, so it is unit tested.

export type Example = { id: string; title: string; lesson?: string; code: string };

export const EXAMPLES: Example[] = [
  {
    id: "hello",
    title: "Hello, Python",
    lesson: "python-basics",
    code: `name = "Asha"
hours = 6
print(f"Hi {name}! {hours} hours a week is {hours * 4} hours a month of learning AI.")
`,
  },
  {
    id: "lists",
    title: "Lists, loops and dictionaries",
    lesson: "python-data-structures",
    code: `marks = {"Python": 82, "Maths": 74, "ML": 91}

for subject, score in marks.items():
    grade = "A" if score >= 85 else "B" if score >= 70 else "C"
    print(f"{subject:<7} {score:>3}  {grade}")

print("Average:", round(sum(marks.values()) / len(marks), 1))
`,
  },
  {
    id: "tokens",
    title: "A tiny tokenizer",
    lesson: "tokens-and-context",
    code: `import re

text = "Language models read tokens, not words. Tokens can be parts of words!"
tokens = re.findall(r"\\w+|[^\\w\\s]", text.lower())

print(len(tokens), "tokens:")
print(tokens)

# Count how often each token appears
counts = {}
for t in tokens:
    counts[t] = counts.get(t, 0) + 1
print(sorted(counts.items(), key=lambda kv: -kv[1])[:5])
`,
  },
  {
    id: "similarity",
    title: "Cosine similarity with NumPy",
    lesson: "embeddings",
    code: `import numpy as np

# Pretend embeddings: similar meanings point in similar directions.
vectors = {
    "king":  np.array([0.9, 0.8, 0.1]),
    "queen": np.array([0.85, 0.82, 0.15]),
    "mango": np.array([0.1, 0.2, 0.95]),
}

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

for word in ["queen", "mango"]:
    print(f"king vs {word}: {cosine(vectors['king'], vectors[word]):.3f}")
`,
  },
  {
    id: "retrieval",
    title: "Find the best passage (the R in RAG)",
    lesson: "rag-app",
    code: `docs = [
    "Refunds are processed within 7 working days.",
    "Our office is open from 9 am to 6 pm IST, Monday to Saturday.",
    "You can pay with UPI, cards or net banking.",
]
question = "How long does a refund take?"

def words(s):
    return set(s.lower().replace("?", "").replace(".", "").split())

scores = [(len(words(question) & words(d)), d) for d in docs]
best = max(scores)
print("Best passage:", best[1])
print("Shared words:", best[0])
`,
  },
  {
    id: "pandas",
    title: "A table with pandas",
    lesson: "pandas-tables",
    code: `import pandas as pd

df = pd.DataFrame({
    "city": ["Bengaluru", "Hyderabad", "Pune", "Chennai"],
    "ai_jobs": [5200, 2900, 1800, 1600],
})
df["share_%"] = (df.ai_jobs / df.ai_jobs.sum() * 100).round(1)
print(df.sort_values("ai_jobs", ascending=False).to_string(index=False))
`,
  },
  {
    id: "bug",
    title: "Fix the bug",
    code: `prices = [120, 80, 45]
total = 0
for i in range(len(prices) + 1):
    total += prices[i]
print("Total:", total)
`,
  },
];

/** Encodes a program for a link (#code=...), so a lesson can open it in the playground. */
export function encodeCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCode(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))).slice(0, 20_000);
  } catch {
    return null;
  }
}
