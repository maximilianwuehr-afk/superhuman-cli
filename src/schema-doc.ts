import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ToolInfo } from "./types.js";

export function renderSchemaMarkdown(tools: ToolInfo[]): string {
  const lines = [
    "# Superhuman MCP Tool Inventory",
    "",
    "Generated from the live Superhuman Mail MCP `tools/list` response.",
    "",
  ];

  for (const tool of tools) {
    lines.push(`## ${tool.name}`, "");
    if (tool.description) lines.push(tool.description, "");
    const required = new Set(tool.inputSchema.required ?? []);
    const properties = Object.entries(tool.inputSchema.properties ?? {});
    if (properties.length === 0) {
      lines.push("Parameters: none", "");
      continue;
    }
    lines.push("| Parameter | Required | Schema |", "| --- | --- | --- |");
    for (const [name, schema] of properties) {
      lines.push(`| \`${name}\` | ${required.has(name) ? "yes" : "no"} | \`${escapePipe(JSON.stringify(schema))}\` |`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export async function writeSchemaMarkdown(path: string, tools: ToolInfo[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, renderSchemaMarkdown(tools), "utf8");
}

function escapePipe(value: string): string {
  return value.replaceAll("|", "\\|");
}
