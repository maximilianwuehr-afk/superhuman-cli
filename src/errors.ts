export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
