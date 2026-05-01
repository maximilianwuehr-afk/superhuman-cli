#!/usr/bin/env node
import { Command } from "commander";
import { buildToolArgs, parseList, parseTimeout } from "./args.js";
import { getAuthStatus, login, logout } from "./auth.js";
import { ALIASES, aliasArgsFromQuestion } from "./aliases.js";
import { CliError, toError } from "./errors.js";
import { assertDoctor, runDoctor } from "./doctor.js";
import { runSelfCheck } from "./e2e.js";
import { callTool, listTools } from "./mcp.js";
import { renderCallResult, renderDoctor, renderTool, renderTools, resolveOutputMode, writeValue } from "./output.js";
import { writeSchemaMarkdown } from "./schema-doc.js";
import { validateSafety } from "./safety.js";
import type { CliGlobalOptions } from "./types.js";

const DEFAULT_TIMEOUT_MS = 120_000;

const program = new Command();

program
  .name("superhuman")
  .description("CLI wrapper for the Superhuman Mail MCP server.")
  .version("1.0.0")
  .option("--json", "write structured JSON to stdout")
  .option("--plain", "write stable plain text to stdout")
  .option("-q, --quiet", "suppress non-essential diagnostics")
  .option("-v, --verbose", "write more diagnostics to stderr")
  .option("--no-color", "disable color")
  .option("--timeout <duration>", "MCP request timeout, e.g. 30s or 2m", "120s")
  .showHelpAfterError();

const auth = program.command("auth").description("Manage Superhuman MCP OAuth.");

auth
  .command("login")
  .description("Start OAuth if needed and verify the MCP can list tools.")
  .action(async () => {
    await run(async (globals) => {
      const count = await login(timeoutMs(globals));
      if (!globals.quiet) process.stdout.write(`Authenticated. ${count} tools available.\n`);
    });
  });

auth
  .command("status")
  .description("Show local MCP OAuth token state without opening OAuth.")
  .option("--check", "connect to the MCP and verify credentials")
  .action(async (options: { check?: boolean }) => {
    await run(async (globals) => {
      const status = await getAuthStatus();
      const mode = resolveOutputMode(globals);
      if (options.check) {
        const count = await login(timeoutMs(globals));
        writeValue({ ...status, connected: true, tools: count }, mode);
      } else {
        writeValue(status, mode);
      }
    });
  });

auth
  .command("logout")
  .description("Remove local mcp-remote OAuth token files.")
  .option("-f, --force", "remove tokens without an interactive prompt")
  .option("--no-input", "fail instead of prompting")
  .action(async (options: { force?: boolean; input?: boolean }) => {
    await run(async (globals) => {
      const removed = await logout({ force: options.force, noInput: options.input === false });
      if (!globals.quiet) process.stdout.write(`Removed ${removed} token file(s).\n`);
    });
  });

program
  .command("doctor")
  .description("Check local install, OAuth state, and live MCP connectivity.")
  .action(async () => {
    await run(async (globals) => {
      const report = await runDoctor({ timeoutMs: timeoutMs(globals) });
      renderDoctor(report, resolveOutputMode(globals));
      assertDoctor(report);
    });
  });

program
  .command("tools")
  .description("List live MCP tools and top-level parameters.")
  .option("-o, --output <file>", "write markdown inventory to a file")
  .action(async (options: { output?: string }) => {
    await run(async (globals) => {
      const tools = await listTools(timeoutMs(globals));
      if (options.output) {
        await writeSchemaMarkdown(options.output, tools);
        if (!globals.quiet) process.stderr.write(`Wrote ${options.output}\n`);
      }
      renderTools(tools, resolveOutputMode(globals));
    });
  });

program
  .command("describe <tool>")
  .description("Describe one MCP tool and its parameters.")
  .action(async (toolName: string) => {
    await run(async (globals) => {
      const tools = await listTools(timeoutMs(globals));
      const tool = tools.find((item) => item.name === toolName);
      if (!tool) throw new CliError(`Unknown tool: ${toolName}`, 2);
      renderTool(tool, resolveOutputMode(globals));
    });
  });

program
  .command("call <tool>")
  .description("Call any MCP tool with JSON or key=value arguments.")
  .option("--args-json <json|@file|->", "JSON object, @file, or stdin")
  .option("--arg <key=value>", "set an argument; dot paths are supported", collect, [])
  .option("-n, --dry-run", "print the tool call without executing it")
  .option("--confirm-send", "required for send_draft/send_email")
  .option("--allow-recipient <email>", "allowed send recipient; repeat or comma-separate", collect, [])
  .option("--safety-recipient <email>", "recipient expected in an opaque draft send; repeat or comma-separate", collect, [])
  .option("--no-input", "disable prompts")
  .action(async (toolName: string, options: CallCommandOptions) => {
    await run(async (globals) => {
      const args = await buildToolArgs(options);
      validateSafety({
        toolName,
        args: { ...args, safety_recipients: parseList(options.safetyRecipient) },
        confirmSend: options.confirmSend,
        allowRecipients: parseList(options.allowRecipient),
        noInput: options.input === false,
      });

      if (options.dryRun) {
        writeValue({ tool: toolName, arguments: args }, resolveOutputMode(globals));
        return;
      }

      const result = await callTool(toolName, args, timeoutMs(globals));
      renderCallResult(result, resolveOutputMode(globals));
    });
  });

for (const alias of ALIASES) {
  const command = program
    .command(alias.name)
    .description(alias.description)
    .option("--args-json <json|@file|->", "JSON object, @file, or stdin")
    .option("--arg <key=value>", "set an argument; dot paths are supported", collect, [])
    .option("-n, --dry-run", "print the tool call without executing it")
    .option("--confirm-send", "required for send aliases")
    .option("--allow-recipient <email>", "allowed send recipient; repeat or comma-separate", collect, [])
    .option("--safety-recipient <email>", "recipient expected in an opaque draft send; repeat or comma-separate", collect, [])
    .option("--no-input", "disable prompts");

  if (alias.name === "query") {
    command.argument("[question...]", "natural-language email/calendar question");
  }

  command.action(async (...values: unknown[]) => {
    await run(async (globals) => {
      const options = values.at(-2) as CallCommandOptions;
      const question = alias.name === "query" ? (values[0] as string[] | undefined)?.join(" ") : undefined;
      const args = await aliasArgsFromQuestion(question, options);
      validateSafety({
        toolName: alias.tool,
        args: { ...args, safety_recipients: parseList(options.safetyRecipient) },
        confirmSend: options.confirmSend,
        allowRecipients: parseList(options.allowRecipient),
        noInput: options.input === false,
      });

      if (options.dryRun) {
        writeValue({ tool: alias.tool, arguments: args }, resolveOutputMode(globals));
        return;
      }

      const result = await callTool(alias.tool, args, timeoutMs(globals));
      renderCallResult(result, resolveOutputMode(globals));
    });
  });
}

program
  .command("e2e")
  .description("End-to-end checks. Send checks are hard-limited to self.")
  .command("self-check")
  .requiredOption("--to <email>", "must match SUPERHUMAN_E2E_SELF_EMAIL")
  .option("--from <email>", "optional verified Superhuman send-as address")
  .option("--confirm-self-send", "explicitly allow the self-send test")
  .action(async (options: { to: string; from?: string; confirmSelfSend?: boolean }) => {
    await run(async (globals) => {
      const result = await runSelfCheck({
        to: options.to,
        from: options.from,
        confirmSelfSend: options.confirmSelfSend,
        timeoutMs: timeoutMs(globals),
      });
      writeValue(result, resolveOutputMode(globals));
    });
  });

program.parseAsync(process.argv).catch((error) => {
  reportError(error);
  process.exit(error instanceof CliError ? error.exitCode : 1);
});

interface CallCommandOptions {
  argsJson?: string;
  arg?: string[];
  dryRun?: boolean;
  confirmSend?: boolean;
  allowRecipient?: string[];
  safetyRecipient?: string[];
  input?: boolean;
}

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

async function run(callback: (globals: CliGlobalOptions) => Promise<void>): Promise<void> {
  try {
    await callback(program.opts<CliGlobalOptions>());
  } catch (error) {
    reportError(error);
    process.exit(error instanceof CliError ? error.exitCode : 1);
  }
}

function timeoutMs(globals: CliGlobalOptions): number {
  return parseTimeout(globals.timeout, DEFAULT_TIMEOUT_MS);
}

function reportError(value: unknown): void {
  const error = toError(value);
  process.stderr.write(`Error: ${error.message}\n`);
  if (error instanceof CliError && error.hint) process.stderr.write(`${error.hint}\n`);
  if (!(error instanceof CliError) && process.env.DEBUG) {
    process.stderr.write(`${error.stack ?? ""}\n`);
  }
}
