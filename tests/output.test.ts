import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAuthStatus, writeValue } from "../src/output.js";

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
});
