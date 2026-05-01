import { describe, expect, it } from "vitest";
import { coerceScalar, parseKeyValue, parseTimeout, setDeep } from "../src/args.js";

describe("args", () => {
  it("coerces common scalar values", () => {
    expect(coerceScalar("true")).toBe(true);
    expect(coerceScalar("false")).toBe(false);
    expect(coerceScalar("42")).toBe(42);
    expect(coerceScalar('{"a":1}')).toEqual({ a: 1 });
    expect(coerceScalar("hello")).toBe("hello");
  });

  it("parses key value arguments", () => {
    expect(parseKeyValue("subject=Hello")).toEqual(["subject", "Hello"]);
  });

  it("sets dotted keys", () => {
    const target: Record<string, unknown> = {};
    setDeep(target, "recipient.email", "me@example.com");
    expect(target).toEqual({ recipient: { email: "me@example.com" } });
  });

  it("parses timeout units", () => {
    expect(parseTimeout("500ms", 1)).toBe(500);
    expect(parseTimeout("30s", 1)).toBe(30_000);
    expect(parseTimeout("2m", 1)).toBe(120_000);
  });
});
