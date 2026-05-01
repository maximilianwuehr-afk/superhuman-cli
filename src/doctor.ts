import { access } from "node:fs/promises";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getAuthStatus } from "./auth.js";
import { CliError } from "./errors.js";
import { listTools } from "./mcp.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

export interface DoctorCheck {
  name: string;
  ok: boolean;
  message: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

export async function runDoctor(options: { timeoutMs: number }): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  checks.push(checkNodeVersion());
  checks.push(await checkExecutable());
  checks.push(checkPackage("@superhuman/mcp-mail"));
  checks.push(checkPackage("mcp-remote"));

  const authStatus = await getAuthStatus();
  checks.push({
    name: "oauth",
    ok: authStatus.hasTokens,
    message: authStatus.hasTokens
      ? `found ${authStatus.tokenFiles.length} Superhuman token file(s)`
      : "no Superhuman OAuth token found; run `superhuman auth login`",
  });

  try {
    const tools = await listTools(options.timeoutMs);
    checks.push({
      name: "mcp",
      ok: tools.length > 0,
      message: `connected; ${tools.length} tool(s) available`,
    });
  } catch (error) {
    checks.push({
      name: "mcp",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function assertDoctor(report: DoctorReport): void {
  if (!report.ok) {
    throw new CliError("Doctor found one or more problems.", 1);
  }
}

function checkNodeVersion(): DoctorCheck {
  const major = Number(process.versions.node.split(".")[0]);
  return {
    name: "node",
    ok: major >= 18,
    message: `Node ${process.versions.node}${major >= 18 ? "" : " is too old; Node 18+ required"}`,
  };
}

async function checkExecutable(): Promise<DoctorCheck> {
  const command = process.env.SUPERHUMAN_MCP_COMMAND || "npx";
  try {
    await execFileAsync(command, ["--version"], { timeout: 10_000 });
    return { name: "mcp-command", ok: true, message: `${command} is available` };
  } catch {
    return { name: "mcp-command", ok: false, message: `${command} is not available on PATH` };
  }
}

function checkPackage(name: string): DoctorCheck {
  try {
    const path = require.resolve(`${name}/package.json`);
    void access(path);
    return { name, ok: true, message: "installed" };
  } catch {
    return { name, ok: false, message: "not installed or not resolvable" };
  }
}
