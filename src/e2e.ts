import { callTool, listTools } from "./mcp.js";
import { CliError } from "./errors.js";
import { validateSafety } from "./safety.js";

export async function runSelfCheck(options: {
  to: string;
  from?: string;
  confirmSelfSend?: boolean;
  timeoutMs: number;
}): Promise<Record<string, unknown>> {
  if (!options.confirmSelfSend) {
    throw new CliError("Refusing e2e send without --confirm-self-send.", 3);
  }

  const expectedSelfEmail = process.env.SUPERHUMAN_E2E_SELF_EMAIL?.trim().toLowerCase();
  if (!expectedSelfEmail) {
    throw new CliError("SUPERHUMAN_E2E_SELF_EMAIL is required for e2e self-check.", 3);
  }

  if (options.to.toLowerCase() !== expectedSelfEmail) {
    throw new CliError("E2E self-check only allows the configured self email.", 3);
  }

  const tools = await listTools(options.timeoutMs);
  const names = new Set(tools.map((tool) => tool.name));
  const requiredTools = ["query_email_and_calendar", "create_or_update_draft", "send_draft"];
  for (const name of requiredTools) {
    if (!names.has(name)) throw new Error(`Required tool missing: ${name}`);
  }

  const subject = `Superhuman CLI self-check ${new Date().toISOString()}`;
  const draftArgs = {
    type: "new",
    to: [options.to],
    subject,
    body: "This is an automated Superhuman CLI self-check email sent only to itself.",
  };
  if (options.from) {
    Object.assign(draftArgs, { from: options.from });
  }

  const draft = await callTool("create_or_update_draft", draftArgs, options.timeoutMs);
  const sendArgs = inferSendArgs(draft);

  validateSafety({
    toolName: "send_draft",
    args: { ...sendArgs, safety_recipients: [options.to] },
    confirmSend: true,
    allowRecipients: [options.to],
  });

  const send = await callTool("send_draft", sendArgs, options.timeoutMs);

  return {
    subject,
    draft,
    send,
  };
}

function inferSendArgs(draftResult: unknown): Record<string, unknown> {
  const draftId = findKey(draftResult, ["draft_id", "draftId", "id"]);
  if (typeof draftId === "string") {
    return { draft_id: draftId };
  }
  throw new Error("Could not find draft_id in create_or_update_draft response.");
}

function findKey(value: unknown, keys: string[]): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findKey(item, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  for (const item of Object.values(record)) {
    const found = findKey(item, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}
