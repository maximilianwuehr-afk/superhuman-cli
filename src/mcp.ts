import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolCallResult, ToolInfo } from "./types.js";

export const DEFAULT_MCP_COMMAND = "npx";
export const DEFAULT_MCP_ARGS = ["-y", "@superhuman/mcp-mail"];

export interface McpSession {
  client: Client;
  close: () => Promise<void>;
}

export async function connectMcp(options: { timeoutMs: number }): Promise<McpSession> {
  const transport = new StdioClientTransport({
    command: process.env.SUPERHUMAN_MCP_COMMAND || DEFAULT_MCP_COMMAND,
    args: process.env.SUPERHUMAN_MCP_ARGS
      ? splitArgs(process.env.SUPERHUMAN_MCP_ARGS)
      : DEFAULT_MCP_ARGS,
    stderr: process.env.DEBUG ? "inherit" : "pipe",
  });

  const client = new Client({
    name: "superhuman-cli",
    version: "1.0.0",
  });

  await client.connect(transport, { timeout: options.timeoutMs });

  return {
    client,
    close: async () => {
      await client.close();
    },
  };
}

export async function withMcp<T>(
  options: { timeoutMs: number },
  callback: (session: McpSession) => Promise<T>,
): Promise<T> {
  const session = await connectMcp(options);
  try {
    return await callback(session);
  } finally {
    await session.close().catch(() => {});
  }
}

export async function listTools(timeoutMs: number): Promise<ToolInfo[]> {
  return withMcp({ timeoutMs }, async ({ client }) => {
    const response = await client.listTools(undefined, { timeout: timeoutMs });
    return response.tools as ToolInfo[];
  });
}

export async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number,
): Promise<ToolCallResult> {
  return withMcp({ timeoutMs }, async ({ client }) => {
    return (await client.callTool(
      { name: toolName, arguments: args },
      undefined,
      { timeout: timeoutMs },
    )) as ToolCallResult;
  });
}

function splitArgs(value: string): string[] {
  return value.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}
