import { buildToolArgs } from "./args.js";

export interface AliasConfig {
  name: string;
  description: string;
  tool: string;
  examples: string[];
}

export const ALIASES: AliasConfig[] = [
  {
    name: "query",
    description: "Ask a natural-language question over Superhuman email and calendar.",
    tool: "query_email_and_calendar",
    examples: [
      "superhuman query 'emails from Ada last week'",
      "superhuman query --json 'what meetings do I have tomorrow?'",
    ],
  },
  {
    name: "draft",
    description: "Create or update a Superhuman draft.",
    tool: "create_or_update_draft",
    examples: [
      "superhuman draft --arg to=me@example.com --arg subject='Hello' --arg body='Hi'",
      "superhuman draft --args-json @draft.json",
    ],
  },
  {
    name: "send",
    description: "Send a draft or email through Superhuman with explicit recipient safety checks.",
    tool: "send_draft",
    examples: [
      "superhuman send --args-json @send.json --confirm-send --allow-recipient me@example.com",
    ],
  },
  {
    name: "event",
    description: "Create or update a calendar event.",
    tool: "create_or_update_event",
    examples: [
      "superhuman event --args-json @event.json",
    ],
  },
  {
    name: "availability",
    description: "Find available meeting times.",
    tool: "get_availability",
    examples: [
      "superhuman availability --args-json @availability.json",
    ],
  },
];

export async function aliasArgsFromQuestion(question: string | undefined, options: { argsJson?: string; arg?: string[] }): Promise<Record<string, unknown>> {
  const args = await buildToolArgs(options);
  if (question) {
    args.question = question;
  }
  return args;
}
