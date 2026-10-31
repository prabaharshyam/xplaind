import type {
  BlogPost,
  Book,
  Certification,
  Channel,
  CheckQuestion,
  Goal,
  GlossaryTerm,
  GuidedProject,
  InterviewQuestion,
  LevelDefinition,
  PlacementQuestion,
  Resource,
  Stop,
} from "./schema";

export type Severity = "error" | "warning";

export type Issue = {
  severity: Severity;
  /** Path relative to the content root, or a short label such as "levels". */
  file: string;
  message: string;
  /** Requirement ID from the PRD when the message carries one, for example "ED-1". */
  rule?: string;
};

export type Entry<T> = { file: string; data: T };

export type Bundle = {
  goals: Entry<Goal>[];
  levels: Entry<LevelDefinition>[];
  stops: Entry<Stop>[];
  resources: Entry<Resource>[];
  placement: Entry<PlacementQuestion>[];
  checks: Entry<CheckQuestion>[];
  interview: Entry<InterviewQuestion>[];
  books: Entry<Book>[];
  glossary: Entry<GlossaryTerm>[];
  certifications: Entry<Certification>[];
  channels: Entry<Channel>[];
  blog: Entry<BlogPost>[];
  projects: Entry<GuidedProject>[];
};

export const emptyBundle = (): Bundle => ({
  goals: [],
  levels: [],
  stops: [],
  resources: [],
  placement: [],
  checks: [],
  interview: [],
  books: [],
  glossary: [],
  certifications: [],
  channels: [],
  blog: [],
  projects: [],
});
