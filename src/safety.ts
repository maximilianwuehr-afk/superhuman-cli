import { CliError } from "./errors.js";
import type { SafetyOptions } from "./types.js";

const SEND_TOOL_NAMES = new Set(["send_draft", "send_email"]);

export function isSendTool(toolName: string): boolean {
  return SEND_TOOL_NAMES.has(toolName);
}

export function validateSafety(options: SafetyOptions): void {
  if (!isSendTool(options.toolName)) return;

  if (!options.confirmSend) {
    throw new CliError(
      `${options.toolName} is blocked until you pass --confirm-send.`,
      3,
      "Review the draft and recipients, then rerun with --confirm-send.",
    );
  }

  const allowlist = normalizeEmails([
    ...(options.allowRecipients ?? []),
    ...parseEnvRecipients(process.env.SUPERHUMAN_ALLOWED_SEND_RECIPIENTS),
  ]);

  if (allowlist.length === 0) {
    throw new CliError(
      `${options.toolName} requires at least one allowed recipient.`,
      3,
      "Pass --allow-recipient email@example.com or set SUPERHUMAN_ALLOWED_SEND_RECIPIENTS.",
    );
  }

  const emails = extractEmails(options.args);
  if (emails.length === 0) {
    throw new CliError(
      `No recipient email addresses were found in the ${options.toolName} arguments.`,
      3,
      "Pass explicit to/cc/bcc recipient fields so the CLI can enforce the allowlist.",
    );
  }

  const blocked = emails.filter((email) => !allowlist.includes(email));
  if (blocked.length > 0) {
    throw new CliError(
      `Blocked send to non-allowlisted recipient(s): ${blocked.join(", ")}`,
      3,
      `Allowed recipients: ${allowlist.join(", ")}`,
    );
  }
}

export function extractEmails(value: unknown): string[] {
  const emails = new Set<string>();
  walk(value, (item) => {
    if (typeof item !== "string") return;
    for (const match of item.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
      emails.add(match[0]!.toLowerCase());
    }
  });
  return [...emails].sort();
}

function walk(value: unknown, visitor: (value: unknown) => void): void {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) walk(item, visitor);
  }
}

function normalizeEmails(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function parseEnvRecipients(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
