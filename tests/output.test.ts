import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAuthStatus, renderCallResult, writeValue } from "../src/output.js";

describe("output", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders auth status without token paths in human mode", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    renderAuthStatus(
      {
        authDir: "/Users/me/.mcp-auth",
        tokenFiles: ["/Users/me/.mcp-auth/token.json"],
        hasTokens: true,
      },
      "human",
    );

    const output = write.mock.calls.map((call) => call[0]).join("");
    expect(output).toContain("Authenticated: yes");
    expect(output).not.toContain("/Users/me/.mcp-auth/token.json");
  });

  it("keeps auth token paths in json mode", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    renderAuthStatus(
      {
        authDir: "/Users/me/.mcp-auth",
        tokenFiles: ["/Users/me/.mcp-auth/token.json"],
        hasTokens: true,
      },
      "json",
    );

    const output = write.mock.calls.map((call) => call[0]).join("");
    expect(output).toContain("/Users/me/.mcp-auth/token.json");
  });

  it("renders complex values as readable key/value lines", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    writeValue({ tool: "create_or_update_draft", arguments: { to: ["me@example.com"] } }, "human");

    const output = write.mock.calls.map((call) => call[0]).join("");
    expect(output).toContain("tool: create_or_update_draft");
    expect(output).toContain("arguments:");
    expect(output).not.toContain('"tool"');
  });

  it("sanitizes control characters in terminal call output", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    renderCallResult(
      {
        content: [{ type: "text", text: "hello\u001b]52;c;secret\u0007\r\nnext" }],
      },
      "human",
    );

    const output = write.mock.calls.map((call) => call[0]).join("");
    expect(output).toBe("hello\\x1b]52;c;secret\\x07\\x0d\nnext\n");
    expect(output).not.toContain("\u001b");
    expect(output).not.toContain("\u0007");
    expect(output).not.toContain("\r");
  });

  it("preserves raw content in json call output", () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const text = "hello\u001b]52;c;secret\u0007\r";

    renderCallResult(
      {
        content: [{ type: "text", text }],
      },
      "json",
    );

    const output = write.mock.calls.map((call) => call[0]).join("");
    expect(JSON.parse(output).content[0].text).toBe(text);
  });
});
