import { describe, expect, it } from "vitest";
import { jobBoost, withGenerated } from "./job";
import { prepSet, type PrepQuestion } from "./plan";

const q = (id: string, level: string, topic = "rag", paths = ["role"]): PrepQuestion => ({ id, level, topic, paths });

describe("PREP-5 matching a job post to the bank", () => {
  const bank = [
    { id: "rag-1", terms: ["Retrieval-augmented generation", "RAG", "Embeddings"] },
    { id: "k8s", terms: ["Kubernetes", "Docker"] },
    { id: "tune", terms: ["Fine-tuning", "LoRA"] },
    { id: "basics", terms: ["AI"] },
    ...Array.from({ length: 20 }, (_, i) => ({ id: `filler-${i}`, terms: ["Model", `unused-${i}`] })),
  ];

  it("finds the questions whose terms the post names, whole words only, rarest match first", () => {
    expect(jobBoost("We need RAG pipelines on Kubernetes. Fine-tuning (LoRA) is a plus.", bank)).toEqual(["tune", "rag-1", "k8s"]); // two terms beat one; a tie keeps bank order
    expect(jobBoost("Storage and fragrance and dockerised things", bank)).toEqual([]); // "rag" inside a word is not RAG
    expect(jobBoost("", bank)).toEqual([]);
    // A different ending still matches; a two-letter term every post contains does not.
    expect(jobBoost("You will fine-tune models for our AI team.", bank)).toEqual(["tune"]);
  });

  it("ignores a term most of the bank shares", () => {
    expect(jobBoost("You will train a model and ship a model.", bank)).toEqual([]);
  });
});

describe("PREP-5 the job post and company type in the question set", () => {
  const all = [...Array.from({ length: 8 }, (_, i) => q(`q${i + 1}`, "I2")), q("design", "I2", "system-design"), q("far", "B1"), q("b1", "I2", "behavioral"), q("b2", "I2", "behavioral"), q("b3", "I2", "behavioral")];

  it("puts the questions the post points at first, in match order, even off-level ones", () => {
    const set = prepSet(all, [], "role", "mid", { boost: ["far", "q5", "not-in-this-role"] });
    expect(set.ids.slice(0, 3)).toEqual(["far", "q5", "q1"]);
    expect(set).toMatchObject({ fromJob: 2, stretch: 0 });
    expect(prepSet(all, [], "role", "mid").fromJob).toBe(0);
  });

  it("a service company gets a behavioural question more often, a startup less, and product companies system design earlier", () => {
    const behaviouralAt = (company: "service" | "startup" | "product") => prepSet(all, [], "role", "mid", { company }).ids.indexOf("b1");
    expect(behaviouralAt("service")).toBe(3);
    expect(behaviouralAt("product")).toBe(4);
    expect(behaviouralAt("startup")).toBe(5);
    expect(prepSet(all, [], "role", "mid", { company: "product" }).ids[0]).toBe("design");
    expect(prepSet(all, [], "role", "mid", { company: "service" }).ids[0]).toBe("q1");
  });
});

describe("PREP-6 questions written for the job post", () => {
  it("sit early in the plan, one after every third bank question, and none is lost", () => {
    expect(withGenerated(["a", "b", "c", "d", "e", "f", "g"], ["jd-1", "jd-2", "jd-3"])).toEqual(["a", "b", "c", "jd-1", "d", "e", "f", "jd-2", "g", "jd-3"]);
    expect(withGenerated(["a"], [])).toEqual(["a"]);
  });
});
