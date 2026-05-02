export type OutputMode = "human" | "json" | "plain";

export interface CliGlobalOptions {
  json?: boolean;
  plain?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
  timeout?: string;
}

export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface CallOptions {
  timeoutMs?: number;
}

export interface SafetyOptions {
  toolName: string;
  args: unknown;
  confirmSend?: boolean;
  allowRecipients?: string[];
}

export interface ToolCallResult {
  content?: Array<Record<string, unknown>>;
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
}
