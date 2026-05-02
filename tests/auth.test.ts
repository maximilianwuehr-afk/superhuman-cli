import { describe, expect, it } from "vitest";
import { logout } from "../src/auth.js";
import { CliError } from "../src/errors.js";

describe("auth", () => {
  it("fails without prompt when no input is requested", async () => {
    await expect(logout({ noInput: true })).rejects.toMatchObject({
      name: "CliError",
      hint: "Run interactively or pass --force.",
    });
  });

  it("cancels logout when the prompt is declined", async () => {
    await expect(logout({ confirm: async () => false })).resolves.toEqual({
      removed: 0,
      cancelled: true,
    });
  });

  it("reports missing confirmation in non-interactive contexts", async () => {
    await expect(logout({})).rejects.toBeInstanceOf(CliError);
  });
});
