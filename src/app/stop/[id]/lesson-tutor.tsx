"use client";

import { AiChat } from "@/components/ai/ai-chat";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { LanguagePicker, useTutorLanguage } from "@/components/ai/language-picker";

/** The AI learning companion: a chat grounded in this lesson's text. */
export function LessonTutor({ enabled, lessonId, title, starters }: { enabled: boolean; lessonId: string; title: string; starters: string[] }) {
  const access = useAiAccess(enabled);
  const language = useTutorLanguage();
  return (
    <AiGate access={access} next={`/stop/${lessonId}#tutor`}>
      <LanguagePicker className="mb-3" />
      <AiChat
        endpoint="/api/ai/tutor"
        extra={{ lessonId, language }}
        compact
        greeting={`Hi! I've read "${title}" with you. Ask me to explain any part again, give another example, or quiz you.`}
        starters={starters.length ? [...starters, "Quiz me on this lesson"] : ["Explain this more simply", "Give me another example from India", "Quiz me on this lesson", "How is this used in a real job?"]}
        placeholder="Ask about this lesson"
      />
    </AiGate>
  );
}
