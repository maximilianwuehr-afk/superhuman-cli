import { describe, expect, it } from "vitest";
import { CliError } from "../src/errors.js";
import { extractEmails, validateSafety } from "../src/safety.js";

describe("safety", () => {
  it("extracts email addresses recursively", () => {
    expect(
      extractEmails({
        to: [{ email: "ME@example.com" }],
        body: "cc hello@example.com",
      }),
    ).toEqual(["hello@example.com", "me@example.com"]);
  });

  it("blocks send tools without confirmation", () => {
    expect(() =>
      validateSafety({
        toolName: "send_draft",
        args: { to: "me@example.com" },
      }),
    ).toThrow(/confirm-send/);
  });

  it("blocks non-allowlisted recipients", () => {
    expect(() =>
      validateSafety({
        toolName: "send_draft",
        args: { to: "person@example.com" },
        confirmSend: true,
        allowRecipients: ["me@example.com"],
      }),
    ).toThrow(/non-allowlisted/);
  });

  it("allows confirmed self-send", () => {
    expect(() =>
      validateSafety({
        toolName: "send_draft",
        args: { to: "me@example.com" },
        confirmSend: true,
        allowRecipients: ["me@example.com"],
      }),
    ).not.toThrow();
  });

  it("allows confirmed draft send with explicit safety recipient", () => {
    expect(() =>
      validateSafety({
        toolName: "send_draft",
        args: { draft_id: "draft_123", safety_recipients: ["me@example.com"] },
        confirmSend: true,
        allowRecipients: ["me@example.com"],
      }),
    ).not.toThrow();
  });

  it("points opaque draft sends to --safety-recipient", () => {
    try {
      validateSafety({
        toolName: "send_draft",
        args: { draft_id: "draft_123" },
        confirmSend: true,
        allowRecipients: ["me@example.com"],
      });
      throw new Error("Expected validateSafety to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CliError);
      expect((error as CliError).hint).toMatch(/--safety-recipient/);
    }
  });
});
