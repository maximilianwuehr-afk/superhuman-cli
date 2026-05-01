import { describe, expect, it } from "vitest";
import { renderSchemaMarkdown } from "../src/schema-doc.js";

describe("schema docs", () => {
  it("renders a markdown inventory", () => {
    const markdown = renderSchemaMarkdown([
      {
        name: "query_email_and_calendar",
        description: "Search mail.",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string" },
          },
        },
      },
    ]);

    expect(markdown).toContain("## query_email_and_calendar");
    expect(markdown).toContain("`query` | yes");
  });
});
