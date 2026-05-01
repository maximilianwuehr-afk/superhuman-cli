import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { CliError } from "./errors.js";
import { listTools } from "./mcp.js";

const MCP_REMOTE_DIR_PREFIX = "mcp-remote-";
const SUPERHUMAN_MCP_URL = "https://mcp.mail.superhuman.com/mcp";
const SUPERHUMAN_SERVER_HASH = createHash("md5").update(SUPERHUMAN_MCP_URL).digest("hex");

export interface AuthStatus {
  authDir: string;
  tokenFiles: string[];
  hasTokens: boolean;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const authDir = join(homedir(), ".mcp-auth");
  const tokenFiles: string[] = [];

  if (!existsSync(authDir)) {
    return { authDir, tokenFiles, hasTokens: false };
  }

  for (const entry of await readdir(authDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(MCP_REMOTE_DIR_PREFIX)) continue;
    const dir = join(authDir, entry.name);
    for (const file of await readdir(dir)) {
      if (file === `${SUPERHUMAN_SERVER_HASH}_tokens.json`) tokenFiles.push(join(dir, file));
    }
  }

  return { authDir, tokenFiles, hasTokens: tokenFiles.length > 0 };
}

export async function login(timeoutMs: number): Promise<number> {
  const tools = await listTools(timeoutMs);
  return tools.length;
}

export async function logout(options: { force?: boolean; noInput?: boolean }): Promise<number> {
  if (!options.force) {
    throw new CliError("Refusing to remove OAuth tokens without --force.", 2);
  }

  const status = await getAuthStatus();
  for (const file of status.tokenFiles) {
    await rm(file, { force: true });
  }
  return status.tokenFiles.length;
}
