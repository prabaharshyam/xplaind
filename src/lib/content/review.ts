// IQ-6 and ED-9: nothing drafted by an AI tool is published until a person has
// signed it off. The sign-off is the reviewed_by / verified_by field, so the
// check is whether that field names a person.

const NOT_A_PERSON =
  /(^|[\s(_/-])(claude|gpt|chatgpt|gemini|copilot|llm|ai|bot|assistant|unverified|unreviewed|pending|todo|tbd|none|n\/a)([\s)_/:-]|$)/i;

export function isHumanName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && !NOT_A_PERSON.test(trimmed);
}
