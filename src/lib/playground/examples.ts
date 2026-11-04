// PG-2 and PG-5: starter programs for the code playground. Short, runnable and fun, each with one
// thing to try. Pure data, so it is unit tested. Inside these template strings a Python "\n" is
// written "\\n", so the Python source keeps its escape.

export type ExampleGroup = "warmup" | "ai" | "challenge";
export type Example = { id: string; group: ExampleGroup; title: string; tip: string; lesson?: string; code: string };

/** PG-5: the playground's sections, in the order they are shown. */
export const EXAMPLE_GROUPS: { id: ExampleGroup; title: string; note: string }[] = [
  { id: "warmup", title: "Warm-ups", note: "Five lines of Python and a smile" },
  { id: "ai", title: "AI ideas", note: "See how AI works, in tiny programs" },
  { id: "challenge", title: "Challenges", note: "Fix it or finish it" },
];

export const EXAMPLES: Example[] = [
  // ------------------------------------------------------------------ warm-ups
  {
    id: "hello",
    group: "warmup",
    title: "Hello, Python",
    tip: "Put in your own name and hours, then press Run.",
    lesson: "python-basics",
    code: `name = "Asha"
hours = 6
print(f"Hi {name}! {hours} hours a week is {hours * 4} hours a month of learning AI.")
`,
  },
  {
    id: "chai",
    group: "warmup",
    title: "Chai budget calculator",
    tip: "Change the price or the cups a day and see the yearly total.",
    lesson: "python-basics",
    code: `cups_a_day = 3
price_per_cup = 15   # rupees

per_month = cups_a_day * price_per_cup * 30
per_year = per_month * 12

print(f"Chai costs you about ₹{per_month:,} a month")
print(f"and ₹{per_year:,} a year.")
print(f"That is {per_year // 499} courses at ₹499 each!")
`,
  },
  {
    id: "pattern",
    group: "warmup",
    title: "Draw a pyramid with text",
    tip: 'Change size to 8, or swap "*" for "#" or an emoji.',
    lesson: "python-basics",
    code: `size = 5
symbol = "*"

for row in range(1, size + 1):
    spaces = " " * (size - row)
    print(spaces + symbol * (2 * row - 1))
`,
  },
  {
    id: "emoji-chart",
    group: "warmup",
    title: "Emoji bar chart of your week",
    tip: "Put in your own study hours for each day.",
    lesson: "python-data-structures",
    code: `hours = {"Mon": 2, "Tue": 1, "Wed": 3, "Thu": 0, "Fri": 2, "Sat": 4, "Sun": 1}

for day, h in hours.items():
    bar = "🟪" * h if h else "·"
    print(f"{day}  {bar}  {h}h")

print("Total this week:", sum(hours.values()), "hours")
`,
  },
  {
    id: "lists",
    group: "warmup",
    title: "Lists, loops and dictionaries",
    tip: "Add a subject to the dictionary and run it again.",
    lesson: "python-data-structures",
    code: `marks = {"Python": 82, "Maths": 74, "ML": 91}

for subject, score in marks.items():
    grade = "A" if score >= 85 else "B" if score >= 70 else "C"
    print(f"{subject:<7} {score:>3}  {grade}")

print("Average:", round(sum(marks.values()) / len(marks), 1))
`,
  },
  {
    id: "rps",
    group: "warmup",
    title: "Rock, paper, scissors",
    tip: "Change rounds to 10, or the seed for a different game.",
    lesson: "python-functions",
    code: `import random

random.seed(7)          # the same game every run; change it for a new one
rounds = 5
moves = ["rock", "paper", "scissors"]
beats = {"rock": "scissors", "paper": "rock", "scissors": "paper"}
score = {"You": 0, "Computer": 0}

for r in range(1, rounds + 1):
    you, cpu = random.choice(moves), random.choice(moves)
    if you == cpu:
        result = "draw"
    elif beats[you] == cpu:
        result = "you win"
        score["You"] += 1
    else:
        result = "computer wins"
        score["Computer"] += 1
    print(f"Round {r}: {you:>8} vs {cpu:<8} -> {result}")

print("Final score:", score)
`,
  },
  {
    id: "guess",
    group: "warmup",
    title: "The computer guesses your number",
    tip: "Change secret to any number from 1 to 100. It never needs more than 7 guesses.",
    lesson: "python-functions",
    code: `secret = 73        # think of a number from 1 to 100
low, high = 1, 100
guesses = 0

while True:
    guess = (low + high) // 2
    guesses += 1
    if guess == secret:
        print(f"Got it: {guess}, in {guesses} guesses!")
        break
    elif guess < secret:
        print(f"{guess}? Too low.")
        low = guess + 1
    else:
        print(f"{guess}? Too high.")
        high = guess - 1
`,
  },

  // ------------------------------------------------------------------ AI ideas
  {
    id: "tokens",
    group: "ai",
    title: "A tiny tokenizer",
    tip: "Change the sentence and count its tokens.",
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
    id: "temperature",
    group: "ai",
    title: "Temperature: how a model picks the next word",
    tip: "Set temperature to 0.2, then to 2.0, and watch the choices change.",
    lesson: "tokens-and-context",
    code: `import math, random

random.seed(1)
# Scores a model might give the next word after "I drink my chai with ..."
scores = {"sugar": 3.0, "ginger": 2.5, "biscuits": 2.0, "friends": 1.0, "ketchup": -1.0}
temperature = 1.0

def probabilities(scores, t):
    exp = {w: math.exp(s / t) for w, s in scores.items()}
    total = sum(exp.values())
    return {w: e / total for w, e in exp.items()}

probs = probabilities(scores, temperature)
for word, p in sorted(probs.items(), key=lambda kv: -kv[1]):
    print(f"{word:<9} {p:6.1%}  {'█' * round(p * 40)}")

picks = random.choices(list(probs), weights=list(probs.values()), k=10)
print("\\n10 samples:", ", ".join(picks))
`,
  },
  {
    id: "similarity",
    group: "ai",
    title: "Cosine similarity with NumPy",
    tip: 'Add a word like "prince" with your own three numbers.',
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
    group: "ai",
    title: "Find the best passage (the R in RAG)",
    tip: 'Ask a different question, like "Can I pay with UPI?"',
    lesson: "rag-app",
    code: `docs = [
    "Refunds are processed within 7 working days.",
    "Our office is open from 9 am to 6 pm IST, Monday to Saturday.",
    "You can pay with UPI, cards or net banking.",
]
question = "How many days do refunds take?"

def words(s):
    return set(s.lower().replace("?", "").replace(".", "").split())

scores = [(len(words(question) & words(d)), d) for d in docs]
best = max(scores)
print("Best passage:", best[1])
print("Shared words:", best[0])
`,
  },
  {
    id: "prompt",
    group: "ai",
    title: "Build a prompt from a template",
    tip: "Change the role, the task or the tone and read the prompt it builds.",
    lesson: "prompt-design",
    code: `role = "a patient maths teacher"
task = "explain what an average is"
audience = "a 12-year-old"
tone = "friendly, with one cricket example"
limit = 80

prompt = f"""You are {role}.
Task: {task} to {audience}.
Tone: {tone}.
Keep it under {limit} words and end with one question to check understanding."""

print(prompt)
print("\\nLength:", len(prompt.split()), "words")
`,
  },
  {
    id: "spam",
    group: "ai",
    title: "A tiny spam filter",
    tip: "Write your own message and see if it gets flagged.",
    lesson: "classification-models",
    code: `spam_words = {"free": 2, "winner": 3, "urgent": 2, "lottery": 3, "click": 1, "offer": 1, "prize": 2}

messages = [
    "Congratulations WINNER! Click to claim your FREE lottery prize",
    "Can we move tomorrow's standup to 10 am?",
    "Urgent: limited offer, only 99 rupees today",
]

def spam_score(text):
    for mark in "!:,.?":
        text = text.replace(mark, " ")
    return sum(spam_words.get(w, 0) for w in text.lower().split())

for m in messages:
    score = spam_score(m)
    label = "SPAM" if score >= 3 else "ok"
    print(f"[{label:>4}] score {score}: {m}")
`,
  },
  {
    id: "knn",
    group: "ai",
    title: "Which fruit is it? Nearest neighbours",
    tip: "Change the mystery fruit's weight and colour, or set k to 1.",
    lesson: "classification-models",
    code: `# ((weight in grams, colour from 0 = green to 10 = red), label)
fruits = [
    ((150, 8), "apple"), ((170, 9), "apple"), ((140, 7), "apple"),
    ((120, 3), "guava"), ((110, 2), "guava"), ((130, 4), "guava"),
    ((300, 6), "mango"), ((280, 7), "mango"), ((320, 5), "mango"),
]
mystery = (160, 6)
k = 3

def distance(a, b):
    return ((a[0] - b[0]) ** 2 + ((a[1] - b[1]) * 20) ** 2) ** 0.5

nearest = sorted(fruits, key=lambda f: distance(f[0], mystery))[:k]
for (w, c), name in nearest:
    print(f"nearby: {name:<6} {w} g, colour {c}")

labels = [name for _, name in nearest]
print("Guess:", max(set(labels), key=labels.count))
`,
  },
  {
    id: "line-fit",
    group: "ai",
    title: "Teach a model: a line of best fit",
    tip: "Add another student, or change steps to 50 and see a worse fit.",
    lesson: "regression-models",
    code: `# Hours studied -> marks scored. Can the model learn the pattern?
hours = [1, 2, 3, 4, 5, 6]
marks = [35, 45, 52, 61, 70, 78]

w, b = 0.0, 0.0          # the model: marks = w * hours + b
lr, steps = 0.01, 2000   # learning rate and training steps

for step in range(steps):
    preds = [w * h + b for h in hours]
    errors = [p - m for p, m in zip(preds, marks)]
    w -= lr * 2 * sum(e * h for e, h in zip(errors, hours)) / len(hours)
    b -= lr * 2 * sum(errors) / len(hours)

print(f"Learned: marks = {w:.1f} x hours + {b:.1f}")
for h in [2.5, 7, 8]:
    print(f"Study {h} hours -> about {w * h + b:.0f} marks")
`,
  },
  {
    id: "metrics",
    group: "ai",
    title: "Accuracy, precision and recall",
    tip: "Change one prediction from 1 to 0 and see which number moves.",
    lesson: "choosing-a-metric",
    code: `# 1 = spam, 0 = not spam
actual    = [1, 0, 1, 1, 0, 0, 1, 0, 0, 1]
predicted = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1]

tp = sum(a == 1 and p == 1 for a, p in zip(actual, predicted))
tn = sum(a == 0 and p == 0 for a, p in zip(actual, predicted))
fp = sum(a == 0 and p == 1 for a, p in zip(actual, predicted))
fn = sum(a == 1 and p == 0 for a, p in zip(actual, predicted))

print(f"Accuracy : {(tp + tn) / len(actual):.0%}  (how often it is right)")
print(f"Precision: {tp / (tp + fp):.0%}  (of the messages it flagged, how many were spam)")
print(f"Recall   : {tp / (tp + fn):.0%}  (of the real spam, how much it caught)")
`,
  },
  {
    id: "pandas",
    group: "ai",
    title: "A table with pandas",
    tip: "Add your city to the table.",
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

  // ---------------------------------------------------------------- challenges
  {
    id: "bug",
    group: "challenge",
    title: "Fix the bug",
    tip: "Run it, read the error, then fix the one line that is wrong.",
    lesson: "python-files-errors",
    code: `prices = [120, 80, 45]
total = 0
for i in range(len(prices) + 1):
    total += prices[i]
print("Total:", total)
`,
  },
  {
    id: "palindrome",
    group: "challenge",
    title: "Is it a palindrome?",
    tip: "Finish the function so every test shows a tick.",
    lesson: "python-functions",
    code: `def is_palindrome(text):
    # TODO: ignore spaces and capital letters, then compare the text with its reverse
    return False

tests = {"Malayalam": True, "never odd or even": True, "Python": False, "Nitin": True}

for word, expected in tests.items():
    ok = is_palindrome(word) == expected
    print("✅" if ok else "❌", word)
`,
  },
  {
    id: "fizzbuzz",
    group: "challenge",
    title: "Fizz, Buzz and Chai",
    tip: 'Make it print "Chai" for multiples of 7 too.',
    lesson: "python-basics",
    code: `for n in range(1, 22):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)
`,
  },
  {
    id: "vowels",
    group: "challenge",
    title: "Count the vowels",
    tip: "Make it count the vowels in your own name, then find the most common one.",
    lesson: "python-data-structures",
    code: `sentence = "Artificial intelligence is learnable"
vowels = "aeiou"

count = 0
for letter in sentence.lower():
    if letter in vowels:
        count += 1

print(f"{count} vowels in: {sentence}")
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
