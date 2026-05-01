import { readFile } from "node:fs/promises";
import { CliError } from "./errors.js";

export function parseKeyValue(value: string): [string, unknown] {
  const index = value.indexOf("=");
  if (index <= 0) {
    throw new CliError(`Invalid --arg value: ${value}`, 2, "Use --arg key=value.");
  }

  const key = value.slice(0, index);
  const raw = value.slice(index + 1);
  return [key, coerceScalar(raw)];
}

export function coerceScalar(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

  if (
    (raw.startsWith("{") && raw.endsWith("}")) ||
    (raw.startsWith("[") && raw.endsWith("]"))
  ) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return raw;
}

export function setDeep(target: Record<string, unknown>, dottedKey: string, value: unknown): void {
  const parts = dottedKey.split(".").filter(Boolean);
  if (parts.length === 0) {
    throw new CliError(`Invalid empty argument key`, 2);
  }

  let cursor: Record<string, unknown> = target;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (!isRecord(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]!] = value;
}

export async function readJsonInput(source?: string): Promise<Record<string, unknown>> {
  if (!source) return {};

  let text: string;
  if (source === "-") {
    text = await readStdin();
  } else if (source.startsWith("@")) {
    text = await readFile(source.slice(1), "utf8");
  } else {
    text = source;
  }

  try {
    const parsed = JSON.parse(text);
    if (!isRecord(parsed)) {
      throw new CliError("--args-json must be a JSON object.", 2);
    }
    return parsed;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError("Could not parse JSON arguments.", 2, String(error));
  }
}

export async function buildToolArgs(options: {
  argsJson?: string;
  arg?: string[];
}): Promise<Record<string, unknown>> {
  const args = await readJsonInput(options.argsJson);
  for (const item of options.arg ?? []) {
    const [key, value] = parseKeyValue(item);
    setDeep(args, key, value);
  }
  return args;
}

export function parseList(value?: string | string[]): string[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) =>
    item
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

export function parseTimeout(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const match = value.match(/^(\d+)(ms|s|m)?$/);
  if (!match) {
    throw new CliError(`Invalid timeout: ${value}`, 2, "Use values like 5000ms, 30s, or 2m.");
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "ms";
  if (unit === "ms") return amount;
  if (unit === "s") return amount * 1000;
  return amount * 60 * 1000;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
