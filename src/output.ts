import type { OutputMode, ToolCallResult, ToolInfo } from "./types.js";
import type { DoctorReport } from "./doctor.js";

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
    process.stdout.write(`${plainText(value)}\n`);
    return;
  }

  process.stdout.write(`${humanText(value)}\n`);
}

export function renderTools(tools: ToolInfo[], mode: OutputMode): void {
  if (mode === "json") {
    writeValue({ tools }, mode);
    return;
  }

  if (mode === "plain") {
    process.stdout.write(`${tools.map((tool) => tool.name).join("\n")}\n`);
    return;
  }

  for (const tool of tools) {
    const required = tool.inputSchema.required?.length
      ? ` Required: ${tool.inputSchema.required.join(", ")}.`
      : "";
    process.stdout.write(`${tool.name}\n`);
    if (tool.description) process.stdout.write(`  ${tool.description}\n`);
    process.stdout.write(`  Parameters: ${Object.keys(tool.inputSchema.properties ?? {}).join(", ") || "none"}.${required}\n\n`);
  }
}

export function renderTool(tool: ToolInfo, mode: OutputMode): void {
  if (mode === "json") {
    writeValue(tool, mode);
    return;
  }

  if (mode === "plain") {
    process.stdout.write(`${tool.name}\n`);
    for (const [name, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
      process.stdout.write(`${name}\t${JSON.stringify(schema)}\n`);
    }
    return;
  }

  process.stdout.write(`${tool.name}\n`);
  if (tool.description) process.stdout.write(`${tool.description}\n\n`);
  const required = new Set(tool.inputSchema.required ?? []);
  const properties = Object.entries(tool.inputSchema.properties ?? {});
  if (properties.length === 0) {
    process.stdout.write("Parameters: none\n");
    return;
  }
  process.stdout.write("Parameters:\n");
  for (const [name, schema] of properties) {
    const marker = required.has(name) ? "required" : "optional";
    process.stdout.write(`  ${name} (${marker}) ${JSON.stringify(schema)}\n`);
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

  process.stdout.write(`${text || humanText(result)}\n`);
}

export function renderDoctor(report: DoctorReport, mode: OutputMode): void {
  if (mode === "json") {
    writeValue(report, mode);
    return;
  }

  if (mode === "plain") {
    for (const check of report.checks) {
      process.stdout.write(`${check.ok ? "ok" : "fail"}\t${check.name}\t${check.message}\n`);
    }
    return;
  }

  for (const check of report.checks) {
    process.stdout.write(`${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.message}\n`);
  }
}

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function humanText(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}
