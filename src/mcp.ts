import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import type { ToolCallResult, ToolInfo } from "./types.js";

const require = createRequire(import.meta.url);
const SUPERHUMAN_MCP_URL = "https://mcp.mail.superhuman.com/mcp";

export const DEFAULT_MCP_COMMAND = process.execPath;
export const DEFAULT_MCP_ARGS = [resolveMcpRemoteBin(), SUPERHUMAN_MCP_URL];

export interface McpSession {
  client: Client;
  timeout: () => number;
  close: () => Promise<void>;
}

export class TimeoutBudget {
  private readonly deadline: number;

  constructor(private readonly totalMs: number) {
    this.deadline = performance.now() + totalMs;
  }

  remaining(): number {
    const remainingMs = Math.ceil(this.deadline - performance.now());
    if (remainingMs <= 0) {
      throw new Error(`MCP request timed out after ${this.totalMs}ms`);
    }
    return remainingMs;
  }
}

export async function connectMcp(options: { budget: TimeoutBudget }): Promise<McpSession> {
  const transport = new StdioClientTransport({
    command: process.env.SUPERHUMAN_MCP_COMMAND || DEFAULT_MCP_COMMAND,
    args: process.env.SUPERHUMAN_MCP_ARGS
      ? splitArgs(process.env.SUPERHUMAN_MCP_ARGS)
      : DEFAULT_MCP_ARGS,
    stderr: process.env.DEBUG ? "inherit" : "ignore",
  });

  const client = new Client({
    name: "superhuman-cli",
    version: "1.0.0",
  });

  await client.connect(transport, { timeout: options.budget.remaining() });

  return {
    client,
    timeout: () => options.budget.remaining(),
    close: async () => {
      await client.close();
    },
  };
}

export async function withMcp<T>(
  options: { timeoutMs: number },
  callback: (session: McpSession) => Promise<T>,
): Promise<T> {
  const budget = new TimeoutBudget(options.timeoutMs);
  const session = await connectMcp({ budget });
  try {
    return await callback(session);
  } finally {
    await session.close().catch(() => {});
  }
}

export async function listTools(timeoutMs: number): Promise<ToolInfo[]> {
  return withMcp({ timeoutMs }, listSessionTools);
}

export async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs: number,
): Promise<ToolCallResult> {
  return withMcp({ timeoutMs }, (session) => callSessionTool(session, toolName, args));
}

export async function listSessionTools(session: McpSession): Promise<ToolInfo[]> {
  const response = await session.client.listTools(undefined, { timeout: session.timeout() });
  return response.tools as ToolInfo[];
}

export async function callSessionTool(
  session: McpSession,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  return (await session.client.callTool(
    { name: toolName, arguments: args },
    undefined,
    { timeout: session.timeout() },
  )) as ToolCallResult;
}

function splitArgs(value: string): string[] {
  return value.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}

function resolveMcpRemoteBin(): string {
  const packageJson = resolvePackageJson("mcp-remote");
  const packageDir = dirname(packageJson);
  return join(packageDir, "dist", "proxy.js");
}

function resolvePackageJson(packageName: string): string {
  try {
    return require.resolve(`${packageName}/package.json`);
  } catch (error) {
    const nested = resolveNestedMcpRemotePackageJson(packageName);
    if (nested) return nested;
    throw error;
  }
}

function resolveNestedMcpRemotePackageJson(packageName: string): string | undefined {
  if (packageName !== "mcp-remote") return undefined;

  try {
    const superhumanPackageJson = require.resolve("@superhuman/mcp-mail/package.json");
    const candidate = join(dirname(superhumanPackageJson), "node_modules", packageName, "package.json");
    return existsSync(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}
