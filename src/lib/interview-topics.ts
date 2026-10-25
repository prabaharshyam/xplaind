// IQ-2: the interview topics, from what interviewers test. No imports, so it is
// safe in schemas, pages and the browser.
export const INTERVIEW_TOPICS = [
  { id: "llm-basics", label: "LLM and transformer basics" },
  { id: "ml-basics", label: "Machine learning basics" },
  { id: "rag", label: "RAG" },
  { id: "agents", label: "Agents and tools" },
  { id: "evals", label: "Evals" },
  { id: "approach-choice", label: "Prompting, RAG or fine-tuning" },
  { id: "system-design", label: "System design" },
  { id: "behavioral", label: "Behavioural" },
] as const;

export type InterviewTopicId = (typeof INTERVIEW_TOPICS)[number]["id"];

export const INTERVIEW_TOPIC_IDS = INTERVIEW_TOPICS.map((t) => t.id) as [InterviewTopicId, ...InterviewTopicId[]];

export const interviewTopicLabel = (id: string): string => INTERVIEW_TOPICS.find((t) => t.id === id)?.label ?? id;
