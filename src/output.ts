import type { OutputMode, ToolCallResult, ToolInfo } from "./types.js";
import type { DoctorReport } from "./doctor.js";
import type { AuthStatus } from "./auth.js";

export interface AuthStatusView extends AuthStatus {
  connected?: boolean;
  tools?: number;
}

export function resolveOutputMode(options: { json?: boolean; plain?: boolean }): OutputMode {
  if (options.json) return "json";
  if (options.plain) return "plain";
  return "human";
}

export function writeValue(value: unknown, mode: OutputMode): void {
  if (mode === "json") {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }

  if (mode === "plain") {
    writeTerminal(`${plainText(value)}\n`);
    return;
  }

  writeTerminal(`${humanText(value)}\n`);
}

export function renderTools(tools: ToolInfo[], mode: OutputMode): void {
  if (mode === "json") {
    writeValue({ tools }, mode);
    return;
  }

  if (mode === "plain") {
    writeTerminal(`${tools.map((tool) => tool.name).join("\n")}\n`);
    return;
  }

  for (const tool of tools) {
    const required = tool.inputSchema.required?.length
      ? ` Required: ${tool.inputSchema.required.join(", ")}.`
      : "";
    writeTerminal(`${tool.name}\n`);
    if (tool.description) writeTerminal(`  ${tool.description}\n`);
    writeTerminal(`  Parameters: ${Object.keys(tool.inputSchema.properties ?? {}).join(", ") || "none"}.${required}\n\n`);
  }
}

export function renderTool(tool: ToolInfo, mode: OutputMode): void {
  if (mode === "json") {
    writeValue(tool, mode);
    return;
  }

  if (mode === "plain") {
    writeTerminal(`${tool.name}\n`);
    for (const [name, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
      writeTerminal(`${name}\t${JSON.stringify(schema)}\n`);
    }
    return;
  }

  writeTerminal(`${tool.name}\n`);
  if (tool.description) writeTerminal(`${tool.description}\n\n`);
  const required = new Set(tool.inputSchema.required ?? []);
  const properties = Object.entries(tool.inputSchema.properties ?? {});
  if (properties.length === 0) {
    writeTerminal("Parameters: none\n");
    return;
  }
  writeTerminal("Parameters:\n");
  for (const [name, schema] of properties) {
    const marker = required.has(name) ? "required" : "optional";
    writeTerminal(`  ${name} (${marker}) ${JSON.stringify(schema)}\n`);
  }
}

export function renderCallResult(result: ToolCallResult, mode: OutputMode): void {
  if (mode === "json") {
    writeValue(result, mode);
    return;
  }

  if (result.structuredContent !== undefined) {
    writeValue(result.structuredContent, mode);
    return;
  }

  const text = result.content
    ?.map((item) => {
      if (item.type === "text" && typeof item.text === "string") return item.text;
      return JSON.stringify(item);
    })
    .filter(Boolean)
    .join("\n");

  writeTerminal(`${text || humanText(result)}\n`);
}

export function renderDoctor(report: DoctorReport, mode: OutputMode): void {
  if (mode === "json") {
    writeValue(report, mode);
    return;
  }

  if (mode === "plain") {
    for (const check of report.checks) {
      writeTerminal(`${check.ok ? "ok" : "fail"}\t${check.name}\t${check.message}\n`);
    }
    return;
  }

  for (const check of report.checks) {
    writeTerminal(`${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.message}\n`);
  }
}

export function renderAuthStatus(
  status: AuthStatusView,
  mode: OutputMode,
  options: { verbose?: boolean } = {},
): void {
  if (mode === "json") {
    writeValue(status, mode);
    return;
  }

  const rows = [
    ["authenticated", status.hasTokens ? "yes" : "no"],
    ["token_files", String(status.tokenFiles.length)],
  ];
  if (status.connected !== undefined) rows.push(["connected", status.connected ? "yes" : "no"]);
  if (status.tools !== undefined) rows.push(["tools", String(status.tools)]);

  if (mode === "plain") {
    writeTerminal(`${rows.map(([key, value]) => `${key}\t${value}`).join("\n")}\n`);
    return;
  }

  writeTerminal(`Authenticated: ${status.hasTokens ? "yes" : "no"}\n`);
  if (status.connected !== undefined) writeTerminal(`Connected: ${status.connected ? "yes" : "no"}\n`);
  if (status.tools !== undefined) writeTerminal(`Tools: ${status.tools}\n`);
  if (options.verbose) {
    writeTerminal(`Auth directory: ${status.authDir}\n`);
    writeTerminal(`Token files: ${status.tokenFiles.length ? status.tokenFiles.join(", ") : "none"}\n`);
  } else if (!status.hasTokens) {
    writeTerminal("Next step: run `superhuman auth login`.\n");
  }
}

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => scalarOrJson(item)).join("\n");
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${key}=${scalarOrJson(item)}`)
      .join("\n");
  }
  return String(value);
}

function humanText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return String(value);
  return formatHuman(value);
}

function writeTerminal(value: string): void {
  process.stdout.write(sanitizeTerminalText(value));
}

function sanitizeTerminalText(value: string): string {
  return value.replace(
    /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g,
    (char) => `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
  );
}

function formatHuman(value: unknown, indent = 0): string {
  const prefix = " ".repeat(indent);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return `${prefix}${String(value)}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `${prefix}[]`;
    return value
      .map((item) => {
        if (isScalar(item)) return `${prefix}- ${String(item)}`;
        return `${prefix}-\n${formatHuman(item, indent + 2)}`;
      })
      .join("\n");
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${prefix}{}`;
    return entries
      .map(([key, item]) => {
        if (isScalar(item)) return `${prefix}${key}: ${String(item)}`;
        return `${prefix}${key}:\n${formatHuman(item, indent + 2)}`;
      })
      .join("\n");
  }

  return `${prefix}${String(value)}`;
}

function scalarOrJson(value: unknown): string {
  if (isScalar(value)) return String(value);
  return JSON.stringify(value);
}

function isScalar(value: unknown): boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
